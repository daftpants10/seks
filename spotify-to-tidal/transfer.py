#!/usr/bin/env python3
"""Copy Spotify playlists to TIDAL.

Matches each track by ISRC first, then falls back to a title/artist search
checked against duration. Writes a CSV report per playlist with match status
and links for buying lossless copies of each track.

Usage:
    python transfer.py --list                  # show your Spotify playlists
    python transfer.py                         # transfer all playlists
    python transfer.py "Road Trip" "Chill"     # transfer selected playlists (name or ID)
    python transfer.py --liked                 # also transfer Liked Songs
"""

import argparse
import csv
import datetime
import json
import os
import re
import sys
import time
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote_plus

import spotipy
import tidalapi
from spotipy.oauth2 import SpotifyOAuth

HERE = Path(__file__).resolve().parent
TIDAL_TOKEN_FILE = HERE / ".tidal-session.json"
REPORT_DIR = HERE / "reports"
DURATION_TOLERANCE = 5  # seconds


# --- Spotify -----------------------------------------------------------------

def spotify_client():
    for var in ("SPOTIPY_CLIENT_ID", "SPOTIPY_CLIENT_SECRET"):
        if not os.environ.get(var):
            sys.exit(f"Missing {var}. See README.md for setup.")
    auth = SpotifyOAuth(
        redirect_uri=os.environ.get("SPOTIPY_REDIRECT_URI", "http://127.0.0.1:8888/callback"),
        scope="playlist-read-private playlist-read-collaborative user-library-read",
        cache_path=str(HERE / ".spotify-cache"),
    )
    return spotipy.Spotify(auth_manager=auth)


def paginate(sp, page):
    while page:
        yield from page["items"]
        page = sp.next(page) if page.get("next") else None


def spotify_playlists(sp):
    return list(paginate(sp, sp.current_user_playlists(limit=50)))


def spotify_tracks(sp, playlist_id=None):
    page = (sp.current_user_saved_tracks(limit=50) if playlist_id is None
            else sp.playlist_items(playlist_id, limit=100, additional_types=("track",)))
    for item in paginate(sp, page):
        t = item.get("track")
        if not t or t.get("type") != "track" or t.get("is_local"):
            continue
        yield {
            "title": t["name"],
            "artists": [a["name"] for a in t["artists"]],
            "album": t["album"]["name"],
            "duration": t["duration_ms"] / 1000,
            "isrc": (t.get("external_ids") or {}).get("isrc"),
        }


# --- TIDAL -------------------------------------------------------------------

def tidal_session():
    session = tidalapi.Session()
    if TIDAL_TOKEN_FILE.exists():
        data = json.loads(TIDAL_TOKEN_FILE.read_text())
        expiry = datetime.datetime.fromisoformat(data["expiry_time"]) if data.get("expiry_time") else None
        try:
            if session.load_oauth_session(data["token_type"], data["access_token"],
                                          data.get("refresh_token"), expiry):
                return session
        except Exception:
            pass
    print("Log in to TIDAL using the link below:")
    session.login_oauth_simple()
    if not session.check_login():
        sys.exit("TIDAL login failed.")
    TIDAL_TOKEN_FILE.write_text(json.dumps({
        "token_type": session.token_type,
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expiry_time": session.expiry_time.isoformat() if session.expiry_time else None,
    }))
    TIDAL_TOKEN_FILE.chmod(0o600)
    return session


def normalize(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\s*[\(\[].*?[\)\]]", "", s)           # drop (feat. x), [Remastered]...
    s = re.sub(r"\s+-\s+.*(remaster|version|edit|mix|mono|live).*$", "", s)
    return re.sub(r"[^a-z0-9 ]+", "", s).strip()


def similarity(a, b):
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def score(track, candidate):
    if abs((candidate.duration or 0) - track["duration"]) > DURATION_TOLERANCE:
        return 0
    title = similarity(track["title"], candidate.name or "")
    cand_artists = " ".join(a.name for a in (candidate.artists or []))
    artist = max(similarity(a, cand_artists) for a in track["artists"])
    if normalize(track["artists"][0]) in normalize(cand_artists):
        artist = 1.0
    return 0.6 * title + 0.4 * artist


def find_on_tidal(session, track):
    if track["isrc"]:
        try:
            hits = session.get_tracks_by_isrc(track["isrc"])
            if hits:
                return hits[0], "isrc"
        except Exception:
            pass
    query = f"{track['artists'][0]} {normalize(track['title'])}"
    try:
        results = session.search(query, models=[tidalapi.Track], limit=10)["tracks"]
    except Exception:
        return None, "error"
    best = max(results, key=lambda c: score(track, c), default=None)
    if best and score(track, best) >= 0.75:
        return best, "search"
    return None, "not found"


# --- Transfer ----------------------------------------------------------------

def buy_links(track):
    q = quote_plus(f"{track['artists'][0]} {track['title']}")
    return (f"https://www.qobuz.com/search?q={q}",
            f"https://bandcamp.com/search?q={q}&item_type=t")


def transfer(sp, session, name, tracks, dry_run):
    print(f"\n== {name} ({len(tracks)} tracks)")
    REPORT_DIR.mkdir(exist_ok=True)
    report = REPORT_DIR / f"{re.sub(r'[^\w.-]+', '_', name)}.csv"
    found_ids = []
    with report.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["artist", "title", "album", "status", "tidal_url", "qobuz_search", "bandcamp_search"])
        for i, t in enumerate(tracks, 1):
            match, how = find_on_tidal(session, t)
            mark = "✓" if match else "✗"
            print(f"  [{i}/{len(tracks)}] {mark} {', '.join(t['artists'])} – {t['title']} ({how})")
            url = f"https://tidal.com/browse/track/{match.id}" if match else ""
            if match and match.id not in found_ids:
                found_ids.append(match.id)
            w.writerow([", ".join(t["artists"]), t["title"], t["album"], how, url, *buy_links(t)])
            time.sleep(0.1)
    print(f"  matched {len(found_ids)}/{len(tracks)} — report: {report}")
    if dry_run or not found_ids:
        return
    playlist = session.user.create_playlist(name, "Imported from Spotify")
    for i in range(0, len(found_ids), 100):
        playlist.add([str(x) for x in found_ids[i:i + 100]])
    print(f"  created TIDAL playlist: https://tidal.com/browse/playlist/{playlist.id}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("playlists", nargs="*", help="playlist names or IDs (default: all)")
    ap.add_argument("--list", action="store_true", help="list Spotify playlists and exit")
    ap.add_argument("--liked", action="store_true", help="also transfer Liked Songs")
    ap.add_argument("--dry-run", action="store_true", help="match tracks and write reports, but create nothing")
    args = ap.parse_args()

    sp = spotify_client()
    playlists = spotify_playlists(sp)
    if args.list:
        for p in playlists:
            print(f"{p['id']}  {p['tracks']['total']:>5}  {p['name']}")
        return

    if args.playlists:
        wanted = {w.lower() for w in args.playlists}
        playlists = [p for p in playlists if p["id"].lower() in wanted or p["name"].lower() in wanted]
        if not playlists and not args.liked:
            sys.exit("No matching playlists. Run with --list to see names.")

    session = tidal_session()
    if args.liked:
        transfer(sp, session, "Liked Songs (Spotify)", list(spotify_tracks(sp)), args.dry_run)
    for p in playlists:
        transfer(sp, session, p["name"], list(spotify_tracks(sp, p["id"])), args.dry_run)


if __name__ == "__main__":
    main()
