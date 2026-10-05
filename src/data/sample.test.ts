import { describe, expect, it } from 'vitest'
import { buildExport } from '../lib/parse'
import { availableYears, computeStats } from '../lib/stats'
import { sampleExport, sampleMeta } from './sample'

describe('sample dataset', () => {
  const parsed = buildExport(sampleExport())

  it('parses through the real pipeline', () => {
    expect(parsed.source).toBe('diary')
    expect(parsed.warnings).toEqual([])
    expect(availableYears(parsed.entries)).toEqual([2026, 2025, 2024])
  })

  it('produces a story worth telling for 2025', () => {
    const s = computeStats(parsed.entries, 2025, { meta: sampleMeta(), reviews: parsed.reviews })
    expect(s.totalFilms).toBeGreaterThan(80)
    expect(s.runtimeCoverage).toBe(1)
    expect(s.busiestMonth?.month).toBe(9) // October
    expect(s.longestStreak!.days).toBeGreaterThanOrEqual(12)
    expect(s.topGenres[0].label).toBe('Horror')
    expect(s.topFilms).toHaveLength(5)
    expect(s.rewatchCount).toBeGreaterThan(0)
    expect(s.harshestMonth).not.toBeNull()
  })
})
