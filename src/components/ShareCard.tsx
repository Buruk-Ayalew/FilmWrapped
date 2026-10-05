import { forwardRef } from 'react'
import { formatHours, formatStars, periodLabel } from '../lib/format'
import type { Personality } from '../lib/personality'
import { MONTHS, type WrappedStats } from '../lib/stats'
import { LogoMark } from './Logo'

interface Props {
  stats: WrappedStats
  personality: Personality
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cream/70">{label}</p>
      <p className="truncate font-display text-lg font-extrabold leading-tight">{value}</p>
    </div>
  )
}

/**
 * The 9:16 summary card exported as a PNG. Rendered at 270×480 CSS pixels and
 * captured at 4× for a 1080×1920 image. Uses no remote images so export always works.
 */
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ stats, personality }, ref) {
  const top = stats.topFilms.slice(0, 3)
  return (
    <div
      ref={ref}
      className="relative flex h-[480px] w-[270px] flex-col overflow-hidden rounded-[22px] p-5 text-cream"
      style={{ background: 'linear-gradient(155deg, #7b2ff7 0%, #ff4d8d 55%, #ff8a3d 100%)' }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-lime/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-52 rounded-full bg-ink/40 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-sm font-extrabold">
          <LogoMark className="size-5" /> FilmWrapped
        </span>
        <span className="rounded-full bg-ink/30 px-2.5 py-0.5 font-display text-xs font-bold">{periodLabel(stats.period)}</span>
      </div>

      <div className="relative mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/80">Film personality</p>
        <p className="mt-1 font-display text-[1.65rem] font-extrabold leading-[0.95]">{personality.title}</p>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl bg-ink/25 p-3">
        <Stat label="Films" value={stats.totalFilms.toLocaleString('en-US')} />
        <Stat label="Hours" value={`${stats.runtimeCoverage < 1 ? '~' : ''}${formatHours(stats.totalMinutes)}`} />
        <Stat label="Avg rating" value={stats.averageRating != null ? `${stats.averageRating.toFixed(1)}★` : '—'} />
        <Stat label="Peak month" value={stats.busiestMonth ? MONTHS[stats.busiestMonth.month] : '—'} />
        {stats.topGenres[0] ? (
          <Stat label="Top genre" value={stats.topGenres[0].label} />
        ) : (
          <Stat label="Era" value={stats.topDecade ? `${stats.topDecade}s` : '—'} />
        )}
        <Stat label="Best streak" value={stats.longestStreak ? `${stats.longestStreak.days} days` : '—'} />
      </div>

      {top.length > 0 && (
        <div className="relative mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/80">Top films</p>
          <ol className="mt-1.5 space-y-1">
            {top.map((f, i) => (
              <li key={f.name} className="flex items-baseline gap-2 text-sm">
                <span className="font-display font-extrabold">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{f.name}</span>
                <span className="shrink-0 text-xs">{formatStars(f.rating)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="relative mt-auto text-[9px] text-cream/70">Made with FilmWrapped · from my Letterboxd diary</p>
    </div>
  )
})

export default ShareCard
