/** One logged viewing. Built from diary.csv (or watched.csv as a fallback). */
export interface WatchEntry {
  name: string
  /** Release year of the film, if known. */
  year: number | null
  /** Date the film was watched, as YYYY-MM-DD. */
  date: string
  /** Rating in stars (0.5–5), or null if unrated. */
  rating: number | null
  rewatch: boolean
  tags: string[]
  liked: boolean
}

export interface ReviewEntry {
  name: string
  year: number | null
  date: string
}

export interface ParsedExport {
  entries: WatchEntry[]
  reviews: ReviewEntry[]
  /** Which file the watch log was built from. */
  source: 'diary' | 'watched' | 'none'
  filesFound: string[]
  warnings: string[]
}

/** Metadata looked up from TMDB (or bundled with the sample dataset). */
export interface FilmMeta {
  runtime: number | null
  genres: string[]
  directors: string[]
  posterUrl: string | null
}

export type MetaLookup = Map<string, FilmMeta>

/** A selected year, or every entry ever logged. */
export type Period = number | 'all'
