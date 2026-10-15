# Spotify → TIDAL

Copies your Spotify playlists (and optionally Liked Songs) into your TIDAL account.

## Setup

1. Python 3.9+, then:
   ```sh
   pip install -r requirements.txt
   ```
2. Create a Spotify app at <https://developer.spotify.com/dashboard>.
   Add `http://127.0.0.1:8888/callback` as a Redirect URI.
3. Export its credentials:
   ```sh
   export SPOTIPY_CLIENT_ID=...
   export SPOTIPY_CLIENT_SECRET=...
   ```

## Run

```sh
python transfer.py --list                # see your playlists
python transfer.py --dry-run             # match everything, create nothing
python transfer.py                       # transfer all playlists
python transfer.py "Road Trip" --liked   # one playlist + Liked Songs
```

The first run opens a Spotify login in your browser and prints a TIDAL login link.
Both logins are cached locally (`.spotify-cache`, `.tidal-session.json`, both gitignored).

## How matching works

- **ISRC first**: the recording's industry ID, which gives an exact match on TIDAL when the track is there.
- **Search as a fallback**: artist + cleaned title, accepted only if the duration is within 5 s and the title/artist similarity is ≥ 0.75.

Each playlist gets a CSV in `reports/` showing what matched, what didn't, and Qobuz/Bandcamp search links for each track.

## Lossless on your device

- **Offline listening:** open the playlist in the TIDAL desktop or mobile app and turn on **Download**,
  with quality set to Max/HiRes. You get lossless playback with no connection.
- **Files you own:** use the Qobuz/Bandcamp links in the report CSVs to buy DRM-free FLAC files.
