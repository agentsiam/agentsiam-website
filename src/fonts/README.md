# src/fonts

The six font families, self-hosted. `next build` reaches no network for type.

Until these files were committed, `src/app/[locale]/layout.tsx` and `src/app/admin/layout.tsx`
loaded all six through `next/font/google`, which fetches `fonts.googleapis.com` and then
`fonts.gstatic.com` at build time. The build therefore depended on a third party, and the
failure did not read as a network failure: offline it says `Failed to fetch \`Poppins\`` under
a module-not-found trace, and Vercel's own builders were not exempt either. The fonts are
here now and the build touches nothing.

## What is here

| Files | Family | Weights | Subset | Loaded by |
|---|---|---|---|---|
| `poppins-latin-600/700/800.woff2` | Poppins | 600, 700, 800 | latin | `next/font/local` |
| `ibm-plex-sans-latin.woff2` | IBM Plex Sans | 400, 500, 600 | latin | `next/font/local` |
| `ibm-plex-mono-latin.woff2` | IBM Plex Mono | 500 | latin | `next/font/local` |
| `unbounded-latin.woff2` | Unbounded | 800 | latin | `next/font/local` |
| `noto-sans-thai-thai.woff2` | Noto Sans Thai | 400, 600, 800 | thai | `next/font/local` |
| `noto-sans-sc-cjk-*.woff2`, `-latin`, `-latin-ext`, `-cyrillic`, `-vietnamese` | Noto Sans SC | 400, 700 | all 101 slices | `noto-sans-sc.generated.css` |

One file serves several weights wherever Google serves a variable font: IBM Plex Sans, Noto
Sans Thai and Noto Sans SC are one woff2 per subset, and the `@font-face` clamps it to each
weight with `font-weight`. Poppins is static, so it is one file per weight.

Two files are **GENERATED** by `scripts/fetch-fonts.mjs` and are never hand-edited:

- `faces.json`, the manifest: family, subset, weights, `unicode-range`, `sha256` and the
  Google URL each file came from.
- `noto-sans-sc.generated.css`, the Noto Sans SC stylesheet.

## Provenance

Every woff2 here is Google's own file, byte for byte. `scripts/fetch-fonts.mjs` asks
`fonts.googleapis.com` for the same `css2` URL `next/font/google` would have asked for, with
the same user agent, and downloads the files that response points at. All 108 were verified
`sha256`-identical to the files the previous `next/font/google` build emitted into
`.next/static/media`, so nothing about the rendered type changed when they moved in here.

The licences are the upstream `OFL.txt` files from `github.com/google/fonts`, one per family:
`OFL-Poppins.txt`, `OFL-IBMPlexSans.txt`, `OFL-IBMPlexMono.txt`, `OFL-Unbounded.txt`,
`OFL-NotoSansThai.txt`, `OFL-NotoSansSC.txt`. All six are SIL Open Font License 1.1, which
permits self-hosting.

## Why only one subset each, and why Noto Sans SC keeps all 101

`next/font/google` downloads every subset in Google's response and preloads only the ones
asked for, so the previous build carried 9.46MB of font files that no browser ever fetched
in full. Measured against the text of all 114 pages in all three languages, the only slices
any character on this site reaches are `latin` for the four Latin families, `thai` for Noto
Sans Thai, and 30 of the 101 Noto Sans SC slices. The five therefore ship one slice each,
119.7KB in total, and the dead subsets (Poppins devanagari, Plex cyrillic and greek,
Unbounded vietnamese, and the `latin` slice of Noto Sans Thai, which no character reaches
because the Latin faces sit in front of it in every stack) are gone.

Noto Sans SC ships all 101 slices, 4.4MB, rather than the 30 the current copy needs. Chinese
copy gets written after this README, and a character outside a shipped slice drops to the
system face silently. The browser still fetches only the ranges a page uses, which is the
point of the slicing.

## Refreshing them

```
node scripts/fetch-fonts.mjs            # prints what would change, writes nothing
node scripts/fetch-fonts.mjs --apply    # downloads and writes
```

By hand only. **No build step fetches a font**, and adding one would put the problem this
directory exists to solve straight back. The dry run compares every file's `sha256` against
`faces.json` and names anything that changed, so a Google-side revision of a face shows up
as a line of output rather than as different type on the site.

A new weight or a new family means editing `FAMILIES` in that script, rerunning it with
`--apply`, and adding the file to the `localFont` call in the layout that needs it. The `src`
array there has to be written out in full: `localFont` takes literal object arguments, and a
helper that builds the array fails to compile.
