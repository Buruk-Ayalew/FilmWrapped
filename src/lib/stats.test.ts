import { describe, expect, it } from 'vitest'
import { filmKey } from './parse'
import {
  availableYears,
  computeStats,
  defaultPeriod,
  DEFAULT_RUNTIME_MINUTES,
  longestStreak,
  rank,
  weekdayIndex,
} from './stats'
import type { FilmMeta, WatchEntry } from './types'

function entry(name: string, date: string, extra: Partial<WatchEntry> = {}): WatchEntry {
  return { name, year: 2000, date, rating: null, rewatch: false, tags: [], liked: false, ...extra }
}

describe('date helpers', () => {
  it('computes weekdays independent of time zone (Monday = 0)', () => {
    expect(weekdayIndex('2025-01-06')).toBe(0) // Monday
    expect(weekdayIndex('2025-01-05')).toBe(6) // Sunday
  })

  it('lists years newest first', () => {
    expect(availableYears([{ date: '2023-01-01' }, { date: '2025-05-05' }, { date: '2023-09-09' }])).toEqual([2025, 2023])
  })

  it('defaults to the most recent complete year', () => {
    const today = new Date(2026, 9, 5)
    expect(defaultPeriod([2026, 2025, 2024], today)).toBe(2025)
    expect(defaultPeriod([2026], today)).toBe(2026)
    expect(defaultPeriod([], today)).toBe('all')
  })
})

describe('longestStreak', () => {
  it('finds the longest run of consecutive days, across month boundaries', () => {
    const streak = longestStreak(['2025-01-30', '2025-01-31', '2025-02-01', '2025-02-01', '2025-03-10', '2025-03-11'])
    expect(streak).toEqual({ days: 3, start: '2025-01-30', end: '2025-02-01' })
  })

  it('handles empty and single-day input', () => {
    expect(longestStreak([])).toBeNull()
    expect(longestStreak(['2025-04-04'])).toEqual({ days: 1, start: '2025-04-04', end: '2025-04-04' })
  })
})

describe('rank', () => {
  it('sorts by count then alphabetically and limits the result', () => {
    expect(rank(['b', 'a', 'b', 'c', 'a', 'd'], 2)).toEqual([
      { label: 'a', count: 2 },
      { label: 'b', count: 2 },
    ])
  })
})

describe('computeStats', () => {
  const entries: WatchEntry[] = [
    entry('Old Year', '2024-12-31', { rating: 1 }),
    entry('Heat', '2025-01-04', { rating: 5, year: 1995, liked: true, tags: ['theater'] }), // Sat
    entry('Alien', '2025-01-05', { rating: 4, year: 1979 }), // Sun
    entry('Heat', '2025-01-06', { rating: 4.5, year: 1995, rewatch: true, tags: ['theater', 'solo'] }), // Mon
    entry('Morbius', '2025-03-01', { rating: 1, year: 2022 }),
    entry('Madame Web', '2025-03-02', { rating: 1.5, year: 2024 }),
    entry('Unrated', '2025-03-15', { year: 2010 }),
  ]

  const s = computeStats(entries, 2025)

  it('filters to the selected period', () => {
    expect(s.totalFilms).toBe(6)
    expect(s.uniqueFilms).toBe(5)
    expect(computeStats(entries, 'all').totalFilms).toBe(7)
  })

  it('estimates runtime when metadata is missing', () => {
    expect(s.totalMinutes).toBe(6 * DEFAULT_RUNTIME_MINUTES)
    expect(s.runtimeCoverage).toBe(0)
  })

  it('finds busiest month, weekday and streak', () => {
    expect(s.busiestMonth).toEqual({ month: 0, count: 3 })
    expect(s.byMonth[2]).toBe(3)
    expect(s.busiestWeekday).toEqual({ day: 5, count: 3 }) // Saturday
    expect(s.longestStreak?.days).toBe(3)
    expect(s.weekendShare).toBeCloseTo(5 / 6)
  })

  it('summarizes ratings and month moods', () => {
    expect(s.ratedCount).toBe(5)
    expect(s.averageRating).toBeCloseTo((5 + 4 + 4.5 + 1 + 1.5) / 5)
    expect(s.ratingDistribution[9]).toBe(1) // one 5★
    expect(s.ratingDistribution[0]).toBe(0)
    expect(s.harshestMonth).toMatchObject({ month: 2, average: 1.25 })
    expect(s.mostGenerousMonth).toMatchObject({ month: 0, average: 4.5 })
  })

  it('ranks top films by best rating, deduplicating rewatches', () => {
    expect(s.topFilms.map((f) => f.name)).toEqual(['Heat', 'Alien', 'Madame Web', 'Morbius'])
    expect(s.topFilms[0]).toMatchObject({ rating: 5, watches: 2, liked: true })
  })

  it('counts rewatches, tags, likes and decades', () => {
    expect(s.rewatchCount).toBe(1)
    expect(s.mostRewatched).toEqual({ name: 'Heat', year: 1995, count: 2 })
    expect(s.topTags[0]).toEqual({ label: 'theater', count: 2 })
    expect(s.likedCount).toBe(1)
    expect(s.decades.map((d) => d.label)).toEqual(['1970s', '1990s', '2010s', '2020s'])
    expect(s.topDecade).toBe(1990)
    expect(s.oldestFilm).toEqual({ name: 'Alien', year: 1979 })
    expect(s.newestFilm).toEqual({ name: 'Madame Web', year: 2024 })
  })

  it('uses metadata for runtime, genres and directors when available', () => {
    const meta = new Map<string, FilmMeta>([
      [filmKey('Heat', 1995), { runtime: 170, genres: ['Crime', 'Drama'], directors: ['Michael Mann'], posterUrl: 'p.jpg' }],
    ])
    const enriched = computeStats(entries, 2025, { meta })
    expect(enriched.enriched).toBe(true)
    expect(enriched.totalMinutes).toBe(170 * 2 + 4 * DEFAULT_RUNTIME_MINUTES)
    expect(enriched.runtimeCoverage).toBeCloseTo(2 / 6)
    expect(enriched.topGenres).toEqual([
      { label: 'Crime', count: 2 },
      { label: 'Drama', count: 2 },
    ])
    expect(enriched.topDirectors[0]).toEqual({ label: 'Michael Mann', count: 2 })
    expect(enriched.topFilms[0].posterUrl).toBe('p.jpg')
  })

  it('copes with an empty period', () => {
    const empty = computeStats(entries, 1990)
    expect(empty.totalFilms).toBe(0)
    expect(empty.busiestMonth).toBeNull()
    expect(empty.averageRating).toBeNull()
    expect(empty.longestStreak).toBeNull()
    expect(empty.harshestMonth).toBeNull()
    expect(empty.topFilms).toEqual([])
    expect(empty.mostRewatched).toBeNull()
  })

  it('counts reviews in the period', () => {
    const reviews = [
      { name: 'Heat', year: 1995, date: '2025-01-04' },
      { name: 'Old', year: 2000, date: '2024-01-01' },
    ]
    expect(computeStats(entries, 2025, { reviews }).reviewCount).toBe(1)
  })
})
