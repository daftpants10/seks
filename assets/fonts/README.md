# typefaces — Glacial Indifference + Modulus Pro

The site uses two typefaces, both self-hosted (neither is on Google Fonts):

- **Glacial Indifference** — display face, used for headings and wordmark-style labels (`strong` row labels, page `h1`s). Shipped under the SIL Open Font License (the license text is kept alongside the source zip). Both weights are in place: `GlacialIndifference-Regular.woff2`, `GlacialIndifference-Bold.woff2`.
- **Modulus Pro** — main body face. Regular (400), SemiBold (600), and Bold (700) are all wired in as separate `@font-face` weights. Note: this copy came from a third-party redistribution site with no license file attached (unlike Glacial Indifference) — worth confirming you're clear to use it commercially before this goes live publicly.

One fix baked into the CSS: the supplied Modulus Pro Bold file has a corrupted "fl" ligature glyph (it rendered "flow" as "ffow"), so every page disables ligatures (`font-variant-ligatures: none` + `font-feature-settings: "liga" 0, "dlig" 0, "clig" 0`) on the body font. Leave that in place unless a cleaner copy of the font replaces this one.

Wired into `index.html`, `the-movement.html`, `join.html`, and `cheatcodes.html`. The dark seksEDS/e8s pages (`EDS.html`, `e8s.html`, `eds-1.html`…`eds-8.html`) still use their original monospace-only styling — say the word and the same two faces can be wired in there too.
