import { describe, expect, it } from 'vitest'
import { buildExport, classifyPath, filmKey, parseDate, parseRating, parseTags, parseYear } from './parse'

const DIARY = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2025-01-03,Heat,1995,https://boxd.it/a,4.5,,"theater, with friends",2025-01-02
2025-01-05,Alien,1979,https://boxd.it/b,,Yes,,2025-01-05
2025-01-06,,2001,https://boxd.it/c,3,,,2025-01-06
2025-01-07,Paddington 2,2017,https://boxd.it/d,5,,,
`

describe('field parsers', () => {
  it('parses ratings in half-star steps and rejects junk', () => {
    expect(parseRating('4.5')).toBe(4.5)
    expect(parseRating('')).toBeNull()
    expect(parseRating('0')).toBeNull()
    expect(parseRating('7')).toBeNull()
    expect(parseRating(undefined)).toBeNull()
  })

  it('validates dates', () => {
    expect(parseDate('2025-02-28')).toBe('2025-02-28')
    expect(parseDate('2025-02-31')).toBeNull()
    expect(parseDate('02/03/2025')).toBeNull()
    expect(parseDate(' ')).toBeNull()
  })

  it('parses years and tags', () => {
    expect(parseYear('1999')).toBe(1999)
    expect(parseYear('')).toBeNull()
    expect(parseTags(' a, b ,,c')).toEqual(['a', 'b', 'c'])
    expect(parseTags('')).toEqual([])
  })

  it('builds case-insensitive film keys', () => {
    expect(filmKey(' Heat ', 1995)).toBe(filmKey('heat', 1995))
    expect(filmKey('Heat', null)).toBe('heat|')
  })
})

describe('buildExport', () => {
  it('reads diary entries, preferring Watched Date and filling ratings and likes', () => {
    const result = buildExport({
      'diary.csv': DIARY,
      'ratings.csv': 'Date,Name,Year,Letterboxd URI,Rating\n2025-01-05,Alien,1979,x,5\n',
      'likes/films.csv': 'Date,Name,Year,Letterboxd URI\n2025-01-03,Heat,1995,x\n',
    })
    expect(result.source).toBe('diary')
    expect(result.entries).toHaveLength(3)
    const [heat, alien, paddington] = result.entries
    expect(heat).toMatchObject({ date: '2025-01-02', rating: 4.5, liked: true, tags: ['theater', 'with friends'] })
    expect(alien).toMatchObject({ rewatch: true, rating: 5, liked: false })
    expect(paddington.date).toBe('2025-01-07')
    expect(result.warnings.some((w) => w.includes('Skipped 1 row'))).toBe(true)
  })

  it('falls back to watched.csv when there is no diary', () => {
    const result = buildExport({ 'watched.csv': 'Date,Name,Year,Letterboxd URI\n2024-05-01,Heat,1995,x\n' })
    expect(result.source).toBe('watched')
    expect(result.entries[0]).toMatchObject({ name: 'Heat', date: '2024-05-01', rewatch: false })
    expect(result.warnings).toHaveLength(1)
  })

  it('handles an empty export and BOMs', () => {
    expect(buildExport({}).entries).toEqual([])
    expect(buildExport({}).source).toBe('none')
    const bom = buildExport({ 'diary.csv': '﻿' + DIARY })
    expect(bom.entries[0].name).toBe('Heat')
  })

  it('collects reviews by watched date', () => {
    const result = buildExport({
      'reviews.csv': 'Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date\n2025-02-02,Heat,1995,x,4,,"Great, truly",,2025-02-01\n',
    })
    expect(result.reviews).toEqual([{ name: 'Heat', year: 1995, date: '2025-02-01' }])
  })
})

describe('classifyPath', () => {
  it('finds files inside the dated export folder', () => {
    expect(classifyPath('letterboxd-me-2025-10-01-12-00-utc/diary.csv')).toBe('diary.csv')
    expect(classifyPath('letterboxd-me/likes/films.csv')).toBe('likes/films.csv')
    expect(classifyPath('films.csv')).toBe('likes/films.csv')
    expect(classifyPath('Ratings.csv')).toBe('ratings.csv')
  })

  it('ignores deleted, orphaned and unrelated files', () => {
    expect(classifyPath('export/deleted/diary.csv')).toBeNull()
    expect(classifyPath('export/orphaned/reviews.csv')).toBeNull()
    expect(classifyPath('__MACOSX/export/diary.csv')).toBeNull()
    expect(classifyPath('export/profile.csv')).toBeNull()
    expect(classifyPath('export/lists/films.csv')).toBeNull()
  })
})
