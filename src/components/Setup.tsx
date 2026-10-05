import { useMemo, useState } from 'react'
import type { LoadedExport } from '../App'
import { periodLabel, plural } from '../lib/format'
import { availableYears, defaultPeriod, filterByPeriod } from '../lib/stats'
import type { Period } from '../lib/types'
import { Wordmark } from './Logo'

interface Props {
  data: LoadedExport
  progress?: { done: number; total: number }
  canEnrich: boolean
  onStart: (period: Period, enrich: boolean) => void
  onBack: () => void
}

export default function Setup({ data, progress, canEnrich, onStart, onBack }: Props) {
  const { entries, warnings, source } = data.parsed
  const years = useMemo(() => availableYears(entries), [entries])
  const [period, setPeriod] = useState<Period>(() => defaultPeriod(years, new Date()))
  const [enrich, setEnrich] = useState(canEnrich)
  const count = filterByPeriod(entries, period).length
  const working = progress != null

  return (
    <main className="relative min-h-full overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -right-32 -top-24 size-[26rem] rounded-full bg-sky/30 blur-3xl" />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <Wordmark className="text-xl" />
          <button type="button" onClick={onBack} className="text-sm text-cream/60 hover:text-cream">
            ← Start over
          </button>
        </div>

        <h1 className="mt-12 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          {data.isSample ? 'Meet our demo cinephile.' : 'Got it. Your films are loaded.'}
        </h1>
        <p className="mt-3 text-cream/70">
          {plural(entries.length, source === 'diary' ? 'diary entry' : 'film', source === 'diary' ? 'diary entries' : 'films')}{' '}
          from {years[years.length - 1]} to {years[0]}.
        </p>
        {warnings.length > 0 && (
          <ul className="mt-4 space-y-1 rounded-2xl bg-tangerine/15 px-4 py-3 text-sm text-cream/80">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}

        <h2 className="mt-10 font-display text-xl font-bold">Which year should we wrap?</h2>
        <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Year">
          {[...years, 'all' as const].map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-5 py-2.5 font-display font-bold transition ${
                period === p ? 'bg-lime text-ink' : 'bg-white/10 text-cream hover:bg-white/20'
              }`}
            >
              {periodLabel(p)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-cream/60">{plural(count, 'film')} logged in this period.</p>

        {canEnrich && (
          <label className="mt-8 flex cursor-pointer gap-3 rounded-2xl bg-white/5 p-4">
            <input
              type="checkbox"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
              className="mt-1 size-5 accent-lime"
            />
            <span>
              <span className="font-semibold">Add genres, directors, runtimes and posters</span>
              <span className="block text-sm text-cream/60">
                Looks up film titles on TMDB. Only titles and years are sent, and results are cached on this device.
              </span>
              <span className="mt-1 block text-xs text-cream/40">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </span>
            </span>
          </label>
        )}

        <button
          type="button"
          disabled={working || count === 0}
          onClick={() => onStart(period, enrich)}
          className="mt-10 rounded-full bg-gradient-to-r from-flare to-violet px-6 py-4 font-display text-xl font-extrabold text-cream shadow-lg shadow-flare/30 transition hover:brightness-110 disabled:opacity-60"
        >
          {working ? `Looking up films… ${progress.done}/${progress.total}` : 'Play my story ▶'}
        </button>
        {working && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-lime transition-[width]"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>
    </main>
  )
}
