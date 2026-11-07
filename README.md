# Uta — Chord Sheet Maker

A small web app for writing chord-over-lyric sheets.

1. **Lyrics** — type or paste the lyrics. Blank lines separate verses; lines in brackets such as `[Chorus]` become section headings.
2. **Chords** — click above any letter to place a chord there. Click a chord to edit or remove it, and drag it (or focus it and press ← / →) to move it.
3. **Export** — download the sheet as PDF, Word (`.docx`) or JSON. A JSON export can be imported again from the home page.

Songs are saved in the browser's `localStorage`. Nothing is sent to a server.

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # type-check and build to dist/
npm run lint
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys every push to `main`. To turn it on, go to the repository's **Settings → Pages** and set **Source** to **GitHub Actions**.

The app uses hash routing (`/#/songs/…`) and a relative Vite `base`, so it works under any `/<repo>/` path without extra configuration.

## AI Disclaimer

This is a personal project created with the help of Claude Code.
