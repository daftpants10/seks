# tracks

Drop your real audio here, named `seks_track_<n>.mp3` where `<n>` is 1–8
(matches the grid button number in the game).

Examples:
- `seks_track_1.mp3`  → button 1 (ambient)
- `seks_track_2.mp3`  → button 2 (groove)
- ... up to `seks_track_8.mp3`

Supported: .mp3 .m4a .wav .ogg .flac

If a file is missing for a button, the game falls back to a generated
procedural beat for that slot — so you can add tracks one at a time.

Keep files reasonably small (ideally < 15 MB each) so the repo and the
deploy stay light. 2–3 min loops at 128–192 kbps are plenty.
