# thesis

latex source for the msc thesis. styled after carla's tu berlin thesis.

## overleaf

1. zip this folder (`main.tex`, `references.bib`, `chapters/`)
2. overleaf → new project → upload project → pick the zip
3. compiler: pdflatex (default). bibtex runs automatically

## local

```
latexmk -pdf main.tex
```

## draft notes

coloured notes in the pdf:

- `\verify{}` (orange): a claim to check against the paper
- `\confirm{}` (blue): a design decision still open
- `\todo{}` (red): missing content

to hide them all for submission, set `\showdraftnotesfalse` in `main.tex`.

for spacing, change `\setstretch{1.15}` to `\onehalfspacing` if fu wants 1.5.

read `CONTEXT.md` for the full project background.
