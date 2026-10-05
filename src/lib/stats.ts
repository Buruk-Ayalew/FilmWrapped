import { filmKey } from './parse'
import type { FilmMeta, MetaLookup, Period, ReviewEntry, WatchEntry } from './types'

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Used for hours watched when a film's runtime is unknown. */
export const DEFAULT_RUNTIME_MINUTES = 110

const DAY_MS = 86_400_000

export interface Ranked {
  label: string
  count: number
}

export interface TopFilm {
  name: string
  year: number | null
  rating: number
  liked: boolean
  watches: number
  posterUrl: string | null
}

export interface Streak {
  days: number
  start: string
  end: string
}

export interface MonthMood {
  month: number
  average: number
  count: number
}

export interface WrappedStats {
  period: Period
  totalFilms: number
  uniqueFilms: number
  totalMinutes: number
  /** Share of entries whose runtime came from real metadata (0–1). */
  runtimeCoverage: number
  byMonth: number[]
  byWeekday: number[]
  busiestMonth: { month: number; count: number } | null
  busiestWeekday: { day: number; count: number } | null
  weekendShare: number
  longestStreak: Streak | null
  /** Ten buckets for 0.5, 1, … 5 stars. */
  ratingDistribution: number[]
  ratedCount: number
  averageRating: number | null
  harshestMonth: MonthMood | null
  mostGenerousMonth: MonthMood | null
  topFilms: TopFilm[]
  topGenres: Ranked[]
  topDirectors: Ranked[]
  enriched: boolean
  rewatchCount: number
  mostRewatched: { name: string; year: number | null; count: number } | null
  topTags: Ranked[]
  likedCount: number
  reviewCount: number
  decades: Ranked[]
  topDecade: number | null
  oldestFilm: { name: string; year: number } | null
  newestFilm: { name: string; year: number } | null
}

/** YYYY-MM-DD → whole days since the epoch, ignoring the local time zone. */
export function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

/** Weekday index with Monday = 0. */
export function weekdayIndex(date: string): number {
  return (new Date(dayNumber(date) * DAY_MS).getUTCDay() + 6) % 7
}

export function monthIndex(date: string): number {
  return Number(date.slice(5, 7)) - 1
}

export function availableYears(entries: { date: string }[]): number[] {
  return [...new Set(entries.map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => b - a)
}

/** The most recent year that has finished, falling back to the latest year with data. */
export function defaultPeriod(years: number[], today: Date): Period {
  if (years.length === 0) return 'all'
  const complete = years.filter((y) => y < today.getFullYear())
  return complete.length ? Math.max(...complete) : Math.max(...years)
}

export function filterByPeriod<T extends { date: string }>(items: T[], period: Period): T[] {
  if (period === 'all') return items
  const prefix = `${period}-`
  return items.filter((e) => e.date.startsWith(prefix))
}

export function longestStreak(dates: string[]): Streak | null {
  const days = [...new Set(dates)].sort()
  if (days.length === 0) return null
  let best: Streak = { days: 1, start: days[0], end: days[0] }
  let runStart = days[0]
  let runLength = 1
  for (let i = 1; i < days.length; i++) {
    if (dayNumber(days[i]) - dayNumber(days[i - 1]) === 1) {
      runLength++
    } else {
      runStart = days[i]
      runLength = 1
    }
    if (runLength > best.days) best = { days: runLength, start: runStart, end: days[i] }
  }
  return best
}

/** Count labels and return them most-frequent first (ties broken alphabetically). */
export function rank(labels: string[], limit = 5): Ranked[] {
  const counts = new Map<string, number>()
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1)
  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
}

function argmax(values: number[]): number {
  let best = -1
  values.forEach((v, i) => {
    if (v > 0 && (best === -1 || v > values[best])) best = i
  })
  return best
}

/** Average rating per calendar month; only months with at least `minRatings` ratings count. */
export function monthMoods(entries: WatchEntry[], minRatings = 2): MonthMood[] {
  const sums = Array.from({ length: 12 }, () => ({ total: 0, count: 0 }))
  for (const e of entries) {
    if (e.rating == null) continue
    const s = sums[monthIndex(e.date)]
    s.total += e.rating
    s.count++
  }
  return sums
    .map((s, month) => ({ month, average: s.count ? s.total / s.count : 0, count: s.count }))
    .filter((m) => m.count >= minRatings)
}

export function computeStats(
  allEntries: WatchEntry[],
  period: Period,
  options: { meta?: MetaLookup; reviews?: ReviewEntry[] } = {},
): WrappedStats {
  const meta = options.meta ?? new Map<string, FilmMeta>()
  const entries = filterByPeriod(allEntries, period)
  const metaFor = (e: WatchEntry) => meta.get(filmKey(e.name, e.year))

  // Volume
  let totalMinutes = 0
  let withRuntime = 0
  for (const e of entries) {
    const runtime = metaFor(e)?.runtime
    if (runtime) withRuntime++
    totalMinutes += runtime || DEFAULT_RUNTIME_MINUTES
  }

  // Timing
  const byMonth = Array(12).fill(0) as number[]
  const byWeekday = Array(7).fill(0) as number[]
  for (const e of entries) {
    byMonth[monthIndex(e.date)]++
    byWeekday[weekdayIndex(e.date)]++
  }
  const bm = argmax(byMonth)
  const bw = argmax(byWeekday)

  // Ratings
  const ratingDistribution = Array(10).fill(0) as number[]
  let ratingTotal = 0
  let ratedCount = 0
  for (const e of entries) {
    if (e.rating == null) continue
    ratingDistribution[e.rating * 2 - 1]++
    ratingTotal += e.rating
    ratedCount++
  }
  const moods = monthMoods(entries)
  const byAverage = [...moods].sort((a, b) => a.average - b.average || b.count - a.count)
  const hasMoodSpread = byAverage.length >= 2 && byAverage[0].average !== byAverage[byAverage.length - 1].average

  // Per-film aggregation
  const films = new Map<string, { entry: WatchEntry; watches: number; bestRating: number | null; lastDate: string }>()
  for (const e of entries) {
    const key = filmKey(e.name, e.year)
    const f = films.get(key)
    if (!f) {
      films.set(key, { entry: e, watches: 1, bestRating: e.rating, lastDate: e.date })
    } else {
      f.watches++
      f.lastDate = e.date
      if (e.rating != null && (f.bestRating == null || e.rating > f.bestRating)) f.bestRating = e.rating
      f.entry = { ...f.entry, liked: f.entry.liked || e.liked }
    }
  }

  const topFilms: TopFilm[] = [...films.entries()]
    .filter(([, f]) => f.bestRating != null)
    .sort(
      ([, a], [, b]) =>
        b.bestRating! - a.bestRating! ||
        Number(b.entry.liked) - Number(a.entry.liked) ||
        b.watches - a.watches ||
        b.lastDate.localeCompare(a.lastDate),
    )
    .slice(0, 5)
    .map(([key, f]) => ({
      name: f.entry.name,
      year: f.entry.year,
      rating: f.bestRating!,
      liked: f.entry.liked,
      watches: f.watches,
      posterUrl: meta.get(key)?.posterUrl ?? null,
    }))

  // Enrichment
  const genres: string[] = []
  const directors: string[] = []
  let enrichedCount = 0
  for (const e of entries) {
    const m = metaFor(e)
    if (!m) continue
    enrichedCount++
    genres.push(...m.genres)
    directors.push(...m.directors)
  }

  // Rewatches: diary-flagged rewatches, plus the film watched most often in the period.
  const rewatchCount = entries.filter((e) => e.rewatch).length
  const most = [...films.values()].sort((a, b) => b.watches - a.watches || b.lastDate.localeCompare(a.lastDate))[0]

  // Decades
  const withYear = entries.filter((e): e is WatchEntry & { year: number } => e.year != null)
  const decades = rank(withYear.map((e) => `${Math.floor(e.year / 10) * 10}s`), 20).sort(
    (a, b) => parseInt(a.label) - parseInt(b.label),
  )
  const topDecadeLabel = rank(withYear.map((e) => `${Math.floor(e.year / 10) * 10}s`), 1)[0]
  const byRelease = [...withYear].sort((a, b) => a.year - b.year)

  const weekend = byWeekday[5] + byWeekday[6]

  return {
    period,
    totalFilms: entries.length,
    uniqueFilms: films.size,
    totalMinutes,
    runtimeCoverage: entries.length ? withRuntime / entries.length : 0,
    byMonth,
    byWeekday,
    busiestMonth: bm === -1 ? null : { month: bm, count: byMonth[bm] },
    busiestWeekday: bw === -1 ? null : { day: bw, count: byWeekday[bw] },
    weekendShare: entries.length ? weekend / entries.length : 0,
    longestStreak: longestStreak(entries.map((e) => e.date)),
    ratingDistribution,
    ratedCount,
    averageRating: ratedCount ? ratingTotal / ratedCount : null,
    harshestMonth: hasMoodSpread ? byAverage[0] : null,
    mostGenerousMonth: hasMoodSpread ? byAverage[byAverage.length - 1] : null,
    topFilms,
    topGenres: rank(genres),
    topDirectors: rank(directors),
    enriched: enrichedCount > 0,
    rewatchCount,
    mostRewatched: most && most.watches > 1 ? { name: most.entry.name, year: most.entry.year, count: most.watches } : null,
    topTags: rank(entries.flatMap((e) => e.tags)),
    likedCount: [...films.values()].filter((f) => f.entry.liked).length,
    reviewCount: filterByPeriod(options.reviews ?? [], period).length,
    decades,
    topDecade: topDecadeLabel ? parseInt(topDecadeLabel.label) : null,
    oldestFilm: byRelease[0] ? { name: byRelease[0].name, year: byRelease[0].year } : null,
    newestFilm: byRelease.length
      ? { name: byRelease[byRelease.length - 1].name, year: byRelease[byRelease.length - 1].year }
      : null,
  }
}
