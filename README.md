# FilmWrapped

Turn your Letterboxd data export into a swipeable, story-style recap of your year in film.

Your export is parsed **entirely in the browser**. Nothing is uploaded anywhere. The one exception is the optional TMDB lookup (see below), which sends film titles and years to TMDB, and only when you turn it on.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

Click **Try the demo** to see a full story built from the bundled sample dataset. No export needed.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm test`          | Run the Vitest suite once            |
| `npm run test:watch`| Run tests in watch mode              |
| `npm run typecheck` | Type-check without emitting          |
| `npm run build`     | Type-check and build to `dist/`      |
| `npm run preview`   | Serve the production build           |

## Getting your Letterboxd export

1. Sign in at [letterboxd.com](https://letterboxd.com) in a browser.
2. Go to **Settings → Data** and choose **Export Your Data**.
3. Download the ZIP and drop it onto FilmWrapped. You don't need to unzip it.

You can also select individual CSVs instead of the ZIP. FilmWrapped reads:

| File              | Used for                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `diary.csv`       | The watch log: dates, ratings, rewatches, tags (primary source)          |
| `ratings.csv`     | Fills in ratings for diary entries that were logged without one          |
| `watched.csv`     | Fallback watch log if there's no diary (uses the date marked as watched) |
| `reviews.csv`     | Review count                                                             |
| `likes/films.csv` | Liked films                                                              |

Every file is optional, and rows with a missing title or invalid date are skipped with a warning. The `deleted/` and `orphaned/` folders in newer exports are ignored.

## Optional: TMDB enrichment

The export has no genres, directors, runtimes or posters. To add them, get a free API key from [TMDB](https://www.themoviedb.org/settings/api) and create `.env.local`:

```bash
VITE_TMDB_API_KEY=your_v3_key_or_v4_read_access_token
```

Restart the dev server and a checkbox appears on the year-picker screen. With enrichment on:

- Films are matched by title and year, preferring an exact title match in the right year.
- Results, including "not found", are cached in `localStorage`, so later runs are instant. Network errors aren't cached, so those films are retried next time.
- **Top genres and directors** gets its own slide, hours use real runtimes, the top-5 slide shows posters, and the personality label can draw on your top genre.

Without a key, everything still works: hours are estimated at 110 minutes per film (labelled as an estimate), and the genre slide is skipped.

> **Note:** `VITE_` variables are compiled into the client bundle. Don't deploy a build with your personal key publicly. For a public deployment, proxy TMDB through a small server function instead.

## The story

| # | Slide | Notes |
|---|-------|-------|
| 1 | Total films + hours | Hours are marked `~` when estimated |
| 2 | Busiest month, favourite weekday, longest streak | Streak = consecutive days with at least one film |
| 3 | Rating distribution, average, harshest vs most generous month | Months need ≥ 2 ratings to qualify |
| 4 | Top 5 highest-rated films | Ties broken by liked, then watch count, then recency |
| 5 | Top genres and directors | Only shown when metadata is available |
| 6 | Rewatches, most-rewatched film, top tags, likes, reviews | |
| 7 | Decade breakdown ("Your cinematic era") | |
| 8 | Film personality | e.g. *The Binge-Prone Horror Fiend* |
| 9 | Shareable summary card | Downloads as a 1080×1920 PNG, or uses the native share sheet on mobile |

**Controls:** tap the right ⅔ / left ⅓, swipe, or use ← → and Space. Press and hold (or press `P`) to pause autoplay, and `Esc` to close. Slides that have no data, like genres without TMDB, are skipped.

## Project structure

```
src/
  lib/                  Pure logic, no React. All unit-tested.
    parse.ts            CSV → normalized WatchEntry[]; ZIP path classification
    stats.ts            computeStats() and helpers (streaks, ranking, periods)
    personality.ts      derivePersonality(stats)
    tmdb.ts             Matching, metadata mapping, cached concurrent enrichment
    format.ts           Display formatting
    loadFiles.ts        Browser File/ZIP reading (JSZip, lazy-loaded)
    types.ts
  data/sample.ts        Deterministic demo export + bundled film metadata
  components/
    Landing.tsx         Upload / demo entry
    Setup.tsx           Year picker + enrichment toggle
    Story.tsx           Slide sequencing, gestures, keyboard, transitions
    ProgressBar.tsx     Segmented autoplay progress
    ShareCard.tsx       The exported 9:16 card
    Poster.tsx          TMDB poster or generated title card
    slides/             One component per slide, plus shared primitives
```

The demo dataset goes through the same `buildExport` → `computeStats` pipeline as a real upload. Its CSVs are generated in-browser from a seeded PRNG, so the demo is identical on every load.

## What's left to do

Things that are known to be missing or unverified:

**Not yet verified**
- [ ] **TMDB enrichment against the live API.** Matching, caching and error handling are unit-tested with a mocked `fetch`, but the app hasn't been run with a real key. Check match quality on a real export, including foreign titles, remakes that share a name (*Suspiria* 1977 vs 2018), and films with no release year.
- [ ] **Posters on the top-5 slide.** The code is there, but it hasn't been checked with real TMDB image URLs.
- [ ] **Real devices.** Tap and swipe were tested in headless Chrome with touch emulation, not on physical iOS or Android devices. The Web Share API path (Share button) is untested.

**Missing features**
- [ ] **TMDB proxy for public deployment.** `VITE_TMDB_API_KEY` is baked into the client bundle. A public site needs a small serverless function that holds the key and proxies `/search/movie` and `/movie/{id}`.
- [ ] **Cancel button for enrichment.** `enrichFilms` already accepts an `AbortSignal`, but the UI doesn't expose it. An "All time" run on a large export can mean thousands of requests.
- [ ] **Rate-limit handling.** TMDB 429 responses are treated like any other failure: the film is skipped for this run and retried next time. Add backoff and retry.
- [ ] **Posters on the share card.** They're left out on purpose: html-to-image needs CORS-clean images, so this needs either a proxy or posters converted to data URLs before export.
- [ ] **Time-of-day personalities** ("Midnight …"). Letterboxd exports have no watch times, so this would need another data source or a user prompt.
- [ ] **Deployment config** (Vercel, Netlify or GitHub Pages) and a CI workflow running `npm test` and `npm run build`.

**Quality**
- [ ] **Component tests** (React Testing Library) for `Story` navigation, `Setup` and `Landing`. Only `src/lib` and the sample data are covered today.
- [ ] **End-to-end test in the repo** (Playwright): demo → all slides → PNG download, plus a ZIP-upload fixture. This was done by hand during development but not committed.
- [ ] **Accessibility pass** with a real screen reader. Autoplay should probably start paused for `prefers-reduced-motion` users. Chart bars only expose values via `aria-label`/`title`, with no touch-friendly tooltip or table view.
- [ ] **Smaller main bundle.** It's about 440 kB (140 kB gzipped). JSZip and html-to-image are already lazy-loaded; Framer Motion is the next candidate (`LazyMotion`).
- [ ] **Large-export performance.** Not profiled on exports with 5,000+ diary entries.

**Known limitations (by design, but worth revisiting)**
- Films are joined across files by title + release year, so a film renamed on Letterboxd between logging and export won't link to its rating or like.
- When `diary.csv` exists, films that appear only in `watched.csv` (never diary-logged) aren't counted.
- "Liked" reflects your likes at export time, not when you watched.

## Tech

Vite · React · TypeScript · Tailwind CSS v4 · Framer Motion · PapaParse · JSZip · html-to-image · Vitest. Fonts (Bricolage Grotesque, DM Sans) are self-hosted via Fontsource, so no font CDN requests are made.

FilmWrapped is an independent fan project and isn't affiliated with Letterboxd, Spotify or TMDB. When TMDB data is used: *This product uses the TMDB API but is not endorsed or certified by TMDB.*
