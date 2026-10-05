import { formatHours, periodLabel } from '../../lib/format'
import type { WrappedStats } from '../../lib/stats'
import { CountUp, Headline, Kicker, Reveal, SlideBody } from './primitives'

export default function TotalSlide({ stats }: { stats: WrappedStats }) {
  const days = stats.totalMinutes / 60 / 24
  const estimated = stats.runtimeCoverage < 1
  return (
    <SlideBody>
      <Reveal>
        <Kicker>{stats.period === 'all' ? 'Your whole film life' : `Your ${periodLabel(stats.period)} in film`}</Kicker>
      </Reveal>
      <Reveal className="mt-6">
        <Headline>You pressed play on</Headline>
      </Reveal>
      <Reveal className="mt-2">
        <CountUp value={stats.totalFilms} className="block font-display text-[7.5rem] font-extrabold leading-none tracking-tighter" />
        <span className="font-display text-3xl font-bold">{stats.totalFilms === 1 ? 'film' : 'films'}</span>
      </Reveal>
      <Reveal className="mt-auto rounded-3xl bg-black/20 p-5 backdrop-blur-sm">
        <p className="text-lg">
          That&rsquo;s{' '}
          <strong className="font-display text-3xl font-extrabold">{estimated ? '~' : ''}{formatHours(stats.totalMinutes)}</strong>{' '}
          hours in the dark
          {days >= 1 && <>, or <strong>{days.toFixed(1)} full days</strong> of your life</>}.
        </p>
        {stats.uniqueFilms !== stats.totalFilms && (
          <p className="mt-2 text-sm opacity-80">{stats.uniqueFilms} different films, because some deserved a second look.</p>
        )}
        {estimated && (
          <p className="mt-2 text-xs opacity-70">
            {stats.runtimeCoverage === 0
              ? 'Hours estimated at ~110 minutes per film.'
              : `Estimated where runtimes were missing (${Math.round(stats.runtimeCoverage * 100)}% known).`}
          </p>
        )}
      </Reveal>
    </SlideBody>
  )
}
