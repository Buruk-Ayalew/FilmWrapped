import { filmKey } from './parse'
import type { FilmMeta, MetaLookup } from './types'

const API = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'
const CACHE_PREFIX = 'filmwrapped:tmdb:v1:'

export interface TmdbSearchResult {
  id: number
  title: string
  original_title?: string
  release_date?: string
  popularity?: number
}

export interface TmdbMovieDetail {
  runtime?: number | null
  genres?: { name: string }[]
  poster_path?: string | null
  credits?: { crew?: { job: string; name: string }[] }
}

export interface CacheStore {
  get(key: string): FilmMeta | null | undefined
  set(key: string, value: FilmMeta | null): void
}

export function tmdbApiKey(): string | null {
  const key = (import.meta.env?.VITE_TMDB_API_KEY as string | undefined)?.trim()
  return key || null
}

/** v4 read-access tokens are JWTs and go in a header; v3 keys go in the query string. */
export function authorize(url: string, apiKey: string): { url: string; init: RequestInit } {
  if (apiKey.startsWith('eyJ')) {
    return { url, init: { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } } }
  }
  const u = new URL(url)
  u.searchParams.set('api_key', apiKey)
  return { url: u.toString(), init: {} }
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Prefer an exact title match released in (or within a year of) the target year, then popularity. */
export function pickBestMatch(results: TmdbSearchResult[], name: string, year: number | null): TmdbSearchResult | null {
  if (results.length === 0) return null
  const target = normalize(name)
  const score = (r: TmdbSearchResult) => {
    const ry = r.release_date ? Number(r.release_date.slice(0, 4)) : null
    let s = 0
    if (normalize(r.title) === target || (r.original_title && normalize(r.original_title) === target)) s += 4
    if (year != null && ry != null) s += ry === year ? 3 : Math.abs(ry - year) === 1 ? 1 : -2
    return s
  }
  return [...results].sort((a, b) => score(b) - score(a) || (b.popularity ?? 0) - (a.popularity ?? 0))[0]
}

export function toFilmMeta(detail: TmdbMovieDetail): FilmMeta {
  return {
    runtime: detail.runtime || null,
    genres: (detail.genres ?? []).map((g) => g.name),
    directors: (detail.credits?.crew ?? []).filter((c) => c.job === 'Director').map((c) => c.name),
    posterUrl: detail.poster_path ? `${IMAGE_BASE}${detail.poster_path}` : null,
  }
}

export const localStorageCache: CacheStore = {
  get(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key)
      return raw == null ? undefined : (JSON.parse(raw) as FilmMeta | null)
    } catch {
      return undefined
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
      // Storage full or unavailable: the lookup still works, it just won't be cached.
    }
  },
}

async function lookupFilm(
  name: string,
  year: number | null,
  apiKey: string,
  fetchFn: typeof fetch,
): Promise<FilmMeta | null> {
  const getJson = async <T,>(url: string): Promise<T> => {
    const { url: u, init } = authorize(url, apiKey)
    const res = await fetchFn(u, init)
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    return res.json() as Promise<T>
  }
  const search = (withYear: boolean) => {
    const u = new URL(`${API}/search/movie`)
    u.searchParams.set('query', name)
    u.searchParams.set('include_adult', 'false')
    if (withYear && year != null) u.searchParams.set('year', String(year))
    return getJson<{ results: TmdbSearchResult[] }>(u.toString())
  }

  let { results } = await search(true)
  if (!results?.length && year != null) ({ results } = await search(false))
  const match = pickBestMatch(results ?? [], name, year)
  if (!match) return null
  const detail = await getJson<TmdbMovieDetail>(`${API}/movie/${match.id}?append_to_response=credits`)
  return toFilmMeta(detail)
}

export interface EnrichOptions {
  apiKey: string
  fetchFn?: typeof fetch
  cache?: CacheStore
  concurrency?: number
  onProgress?: (done: number, total: number) => void
  signal?: AbortSignal
}

/**
 * Look up metadata for each film. Results (including misses) are cached; network
 * errors are skipped without caching so a later run can retry them.
 */
export async function enrichFilms(
  films: { name: string; year: number | null }[],
  { apiKey, fetchFn = fetch.bind(globalThis), cache = localStorageCache, concurrency = 6, onProgress, signal }: EnrichOptions,
): Promise<MetaLookup> {
  const unique = new Map<string, { name: string; year: number | null }>()
  for (const f of films) unique.set(filmKey(f.name, f.year), f)
  const queue = [...unique]
  const out: MetaLookup = new Map()
  let done = 0

  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      const [key, film] = queue.shift()!
      const cached = cache.get(key)
      if (cached !== undefined) {
        if (cached) out.set(key, cached)
      } else {
        try {
          const meta = await lookupFilm(film.name, film.year, apiKey, fetchFn)
          cache.set(key, meta)
          if (meta) out.set(key, meta)
        } catch {
          // Network or rate-limit failure: carry on without this film.
        }
      }
      onProgress?.(++done, unique.size)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  return out
}
