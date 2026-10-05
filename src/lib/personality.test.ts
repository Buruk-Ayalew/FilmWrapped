import { describe, expect, it } from 'vitest'
import { derivePersonality } from './personality'
import { computeStats, type WrappedStats } from './stats'

const base: WrappedStats = computeStats([], 'all')

function stats(overrides: Partial<WrappedStats>): WrappedStats {
  return { ...base, totalFilms: 20, uniqueFilms: 20, ...overrides }
}

describe('derivePersonality', () => {
  it('combines a streak with the top genre', () => {
    const p = derivePersonality(
      stats({ longestStreak: { days: 9, start: '2025-10-20', end: '2025-10-28' }, topGenres: [{ label: 'Horror', count: 30 }] }),
    )
    expect(p.title).toBe('The Binge-Prone Horror Fiend')
    expect(p.traits).toContain('9-day streak')
  })

  it('labels harsh and generous critics', () => {
    expect(derivePersonality(stats({ averageRating: 2.2, ratedCount: 10 })).title).toMatch(/^The Hard-to-Please/)
    expect(derivePersonality(stats({ averageRating: 4.3, ratedCount: 10 })).title).toMatch(/^The Starry-Eyed/)
  })

  it('falls back to unknown genres and non-genre nouns', () => {
    expect(derivePersonality(stats({ topGenres: [{ label: 'TV Movie', count: 3 }] })).title).toBe('The Curious TV Movie Loyalist')
    expect(derivePersonality(stats({ rewatchCount: 8 })).title).toBe('The Curious Comfort Rewatcher')
    expect(derivePersonality(stats({ topDecade: 2020 })).title).toBe('The Curious New Release Chaser')
  })

  it('avoids a redundant vintage archive label', () => {
    expect(derivePersonality(stats({ topDecade: 1950 })).title).toBe('The Devoted Archive Diver')
  })

  it('handles a completely empty year', () => {
    expect(derivePersonality(base).title).toBe('The Curious Film Wanderer')
  })
})
