# Spotify playlists → Bandcamp shopping sheet

Builds a spreadsheet with one tab per playlist:

| Artist | Track | Year | Bandcamp | Status |
|---|---|---|---|---|

- **found**: a link to the track on Bandcamp.
- **possible** (yellow): a close match. Check that it's the right artist or version before you buy.
- **not found** (grey): nothing on Bandcamp. Look on Qobuz or another store instead.

A **Summary** tab shows how many tracks from each playlist are on Bandcamp.

## 1. Get your playlists (easiest: Exportify)

1. Go to <https://exportify.app> and log in with Spotify.
2. Click **Export All**, or export just the playlists you want. Each one downloads as a CSV.
3. Unzip into a folder called `exports/` next to this script.

Exportify lists every playlist in your library. Export only your own playlists if you don't want the ones you follow.

## 2. Run

```sh
pip install openpyxl
python bandcamp_sheet.py --csv exports/*.csv
```

This takes about 1.5 s per unique track, because searches are spaced out to stay polite to Bandcamp.
Results are cached, so re-running is fast and only searches new tracks.

## 3. Open in Google Sheets

Upload `bandcamp-playlists.xlsx` to Google Drive, then **Open with → Google Sheets**.
The tabs, links and colours carry over. To get a native Google Sheet, use **File → Save as Google Sheets**.

## Alternative: Spotify API instead of Exportify

This reads only playlists you own. It needs a Spotify developer app (<https://developer.spotify.com/dashboard>)
with redirect URI `http://127.0.0.1:8888/callback`.

```sh
pip install -r requirements.txt
export SPOTIPY_CLIENT_ID=... SPOTIPY_CLIENT_SECRET=...
python bandcamp_sheet.py --list
python bandcamp_sheet.py                  # all playlists you own
python bandcamp_sheet.py "Road Trip"      # just one
```

## Notes

- **Year** is the release date of the album or single the track appears on in Spotify. A remaster or
  compilation can show a later year than the original recording.
- Bandcamp has no official search API. This uses the same search endpoint as the bandcamp.com search
  box, so it could change without notice.
