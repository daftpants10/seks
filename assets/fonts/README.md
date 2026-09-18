# typefaces — Glacial Indifference + Modulus Pro

The site uses two typefaces, both self-hosted (neither is on Google Fonts):

- **Glacial Indifference** — display face, used for headings and wordmark-style labels (`strong` row labels, page `h1`s). Shipped under the SIL Open Font License (the license text is kept alongside the source zip). Both weights are in place: `GlacialIndifference-Regular.woff2`, `GlacialIndifference-Bold.woff2`.
- **Modulus Pro** — main body face. Only the **Bold** cut was supplied (no Regular), so `ModulusPro-Bold.woff2` is declared at `font-weight: 400` and used as the default body weight everywhere. If a true regular/lighter cut becomes available later, add it as its own `@font-face` at `font-weight: 400` and this one can move to `700`. Note: this copy came from a third-party redistribution site with no license file attached (unlike Glacial Indifference) — worth confirming you're clear to use it commercially before this goes live publicly.

Wired into `index.html`, `the-movement.html`, `join.html`, and `cheatcodes.html`. The dark seksEDS/e8s pages (`EDS.html`, `e8s.html`, `eds-1.html`…`eds-8.html`) still use their original monospace-only styling — say the word and the same two faces can be wired in there too.
