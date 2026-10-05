import { describe, expect, it, vi } from 'vitest'
import { authorize, enrichFilms, pickBestMatch, toFilmMeta, type CacheStore } from './tmdb'
import type { FilmMeta } from './types'

describe('pickBestMatch', () => {
  const results = [
    { id: 1, title: 'Halloween', release_date: '2018-10-19', popularity: 90 },
    { id: 2, title: 'Halloween', release_date: '1978-10-25', popularity: 40 },
    { id: 3, title: 'Halloween II', release_date: '1978-01-01', popularity: 99 },
  ]

  it('prefers exact title and year over popularity', () => {
    expect(pickBestMatch(results, 'Halloween', 1978)?.id).toBe(2)
    expect(pickBestMatch(results, 'Halloween', 2018)?.id).toBe(1)
  })

  it('ignores accents and punctuation', () => {
    expect(pickBestMatch([{ id: 9, title: 'Amélie', release_date: '2001-04-25' }], 'Amelie', 2001)?.id).toBe(9)
  })

  it('returns null for no results', () => {
    expect(pickBestMatch([], 'Anything', 2000)).toBeNull()
  })
})

describe('toFilmMeta', () => {
  it('extracts runtime, genres, directors and poster', () => {
    expect(
      toFilmMeta({
        runtime: 109,
        genres: [{ name: 'Horror' }],
        poster_path: '/x.jpg',
        credits: { crew: [{ job: 'Director', name: 'John Carpenter' }, { job: 'Writer', name: 'Bill Lancaster' }] },
      }),
    ).toEqual({ runtime: 109, genres: ['Horror'], directors: ['John Carpenter'], posterUrl: 'https://image.tmdb.org/t/p/w342/x.jpg' })
    expect(toFilmMeta({ runtime: 0 })).toEqual({ runtime: null, genres: [], directors: [], posterUrl: null })
  })
})

describe('authorize', () => {
  it('uses a query param for v3 keys and a bearer header for v4 tokens', () => {
    expect(authorize('https://api.themoviedb.org/3/x', 'abc').url).toContain('api_key=abc')
    const v4 = authorize('https://api.themoviedb.org/3/x', 'eyJhbGciOi')
    expect(v4.url).not.toContain('api_key')
    expect(v4.init.headers).toMatchObject({ Authorization: 'Bearer eyJhbGciOi' })
  })
})

describe('enrichFilms', () => {
  const memoryCache = (): CacheStore & { store: Map<string, FilmMeta | null> } => {
    const store = new Map<string, FilmMeta | null>()
    return { store, get: (k) => store.get(k), set: (k, v) => void store.set(k, v) }
  }

  const json = (body: unknown, ok = true) => Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(body) } as Response)

  it('searches, fetches details, caches and deduplicates', async () => {
    const fetchFn = vi.fn((url: string) =>
      url.includes('/search/movie')
        ? json({ results: [{ id: 7, title: 'Heat', release_date: '1995-12-15' }] })
        : json({ runtime: 170, genres: [{ name: 'Crime' }], credits: { crew: [{ job: 'Director', name: 'Michael Mann' }] } }),
    )
    const cache = memoryCache()
    const progress: number[] = []
    const meta = await enrichFilms(
      [
        { name: 'Heat', year: 1995 },
        { name: 'heat', year: 1995 },
      ],
      { apiKey: 'k', fetchFn: fetchFn as unknown as typeof fetch, cache, onProgress: (d) => progress.push(d) },
    )
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(meta.get('heat|1995')?.runtime).toBe(170)
    expect(cache.store.has('heat|1995')).toBe(true)
    expect(progress).toEqual([1])

    // Second run is served from cache.
    await enrichFilms([{ name: 'Heat', year: 1995 }], { apiKey: 'k', fetchFn: fetchFn as unknown as typeof fetch, cache })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('retries without a year, and caches misses', async () => {
    const fetchFn = vi.fn(() => json({ results: [] }))
    const cache = memoryCache()
    const meta = await enrichFilms([{ name: 'Nothing', year: 2001 }], { apiKey: 'k', fetchFn: fetchFn as unknown as typeof fetch, cache })
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(meta.size).toBe(0)
    expect(cache.store.get('nothing|2001')).toBeNull()
  })

  it('survives network errors without caching them', async () => {
    const fetchFn = vi.fn(() => json({}, false))
    const cache = memoryCache()
    const meta = await enrichFilms([{ name: 'Heat', year: 1995 }], { apiKey: 'k', fetchFn: fetchFn as unknown as typeof fetch, cache })
    expect(meta.size).toBe(0)
    expect(cache.store.size).toBe(0)
  })
})
