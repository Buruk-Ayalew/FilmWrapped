import Papa from 'papaparse'
import type { ParsedExport, ReviewEntry, WatchEntry } from './types'

/** The export files FilmWrapped understands, keyed by canonical name. */
export type ExportFiles = Partial<Record<ExportFileName, string>>
export type ExportFileName = 'diary.csv' | 'ratings.csv' | 'watched.csv' | 'reviews.csv' | 'likes/films.csv'

type Row = Record<string, string | undefined>

/** Stable key for a film across the different export files. */
export function filmKey(name: string, year: number | null): string {
  return `${name.trim().toLowerCase()}|${year ?? ''}`
}

export function parseCsv(text: string): Row[] {
  const result = Papa.parse<Row>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })
  return result.data
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseDate(value: string | undefined): string | null {
  const v = value?.trim()
  if (!v || !DATE_RE.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  // Reject impossible dates such as 2023-02-31.
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? v : null
}

export function parseRating(value: string | undefined): number | null {
  const n = Number.parseFloat(value ?? '')
  if (!Number.isFinite(n) || n < 0.5 || n > 5) return null
  return Math.round(n * 2) / 2
}

export function parseYear(value: string | undefined): number | null {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 1800 && n < 3000 ? n : null
}

export function parseTags(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function str(row: Row, key: string): string {
  return row[key]?.trim() ?? ''
}

/**
 * Turn the raw CSV text of a Letterboxd export into a normalized watch log.
 * Every file is optional; missing or malformed rows are skipped with a warning.
 */
export function buildExport(files: ExportFiles): ParsedExport {
  const warnings: string[] = []
  const filesFound = (Object.keys(files) as ExportFileName[]).filter((k) => files[k] != null)

  const ratings = new Map<string, number>()
  for (const row of files['ratings.csv'] ? parseCsv(files['ratings.csv']) : []) {
    const rating = parseRating(row.Rating)
    const name = str(row, 'Name')
    if (name && rating != null) ratings.set(filmKey(name, parseYear(row.Year)), rating)
  }

  const likes = new Set<string>()
  for (const row of files['likes/films.csv'] ? parseCsv(files['likes/films.csv']) : []) {
    const name = str(row, 'Name')
    if (name) likes.add(filmKey(name, parseYear(row.Year)))
  }

  const entries: WatchEntry[] = []
  let source: ParsedExport['source'] = 'none'
  let skipped = 0

  if (files['diary.csv']) {
    source = 'diary'
    for (const row of parseCsv(files['diary.csv'])) {
      const name = str(row, 'Name')
      const date = parseDate(row['Watched Date']) ?? parseDate(row.Date)
      if (!name || !date) {
        skipped++
        continue
      }
      const year = parseYear(row.Year)
      const key = filmKey(name, year)
      entries.push({
        name,
        year,
        date,
        rating: parseRating(row.Rating) ?? ratings.get(key) ?? null,
        rewatch: str(row, 'Rewatch').toLowerCase() === 'yes',
        tags: parseTags(row.Tags),
        liked: likes.has(key),
      })
    }
  } else if (files['watched.csv']) {
    source = 'watched'
    warnings.push('No diary.csv found, so dates are when films were marked as watched rather than diary dates.')
    for (const row of parseCsv(files['watched.csv'])) {
      const name = str(row, 'Name')
      const date = parseDate(row.Date)
      if (!name || !date) {
        skipped++
        continue
      }
      const year = parseYear(row.Year)
      const key = filmKey(name, year)
      entries.push({
        name,
        year,
        date,
        rating: ratings.get(key) ?? null,
        rewatch: false,
        tags: [],
        liked: likes.has(key),
      })
    }
  } else {
    warnings.push('No diary.csv or watched.csv found, so there is nothing to wrap yet.')
  }

  if (skipped > 0) warnings.push(`Skipped ${skipped} row${skipped === 1 ? '' : 's'} with a missing title or date.`)

  const reviews: ReviewEntry[] = []
  for (const row of files['reviews.csv'] ? parseCsv(files['reviews.csv']) : []) {
    const name = str(row, 'Name')
    const date = parseDate(row['Watched Date']) ?? parseDate(row.Date)
    if (name && date) reviews.push({ name, year: parseYear(row.Year), date })
  }

  entries.sort((a, b) => a.date.localeCompare(b.date))
  return { entries, reviews, source, filesFound, warnings }
}

/**
 * Map a path inside the export (or an uploaded file name) to the file it represents.
 * Letterboxd nests everything in a dated folder and keeps `deleted/` and `orphaned/`
 * copies, which we ignore.
 */
export function classifyPath(path: string): ExportFileName | null {
  const p = path.replace(/\\/g, '/').toLowerCase()
  const parts = p.split('/')
  if (parts.some((s) => s === 'deleted' || s === 'orphaned' || s === '__macosx')) return null
  const base = parts[parts.length - 1]
  const parent = parts[parts.length - 2]
  if (parent === 'likes' && base === 'films.csv') return 'likes/films.csv'
  if (base === 'films.csv' && parts.length === 1) return 'likes/films.csv'
  if (base === 'diary.csv' || base === 'ratings.csv' || base === 'watched.csv' || base === 'reviews.csv') return base
  return null
}
