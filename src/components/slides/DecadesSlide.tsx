import type { WrappedStats } from '../../lib/stats'
import { ColumnChart, Headline, Kicker, Reveal, SlideBody } from './primitives'

function eraLine(decade: number): string {
  if (decade < 1960) return 'Black and white and timeless all over.'
  if (decade < 1980) return 'Grainy prints, big swings, New Hollywood energy.'
  if (decade < 2000) return 'VHS-era royalty. Be kind, rewind.'
  if (decade < 2020) return 'Prestige pictures and the indie boom.'
  return 'Fresh off the festival circuit. You live in the now.'
}

export default function DecadesSlide({ stats }: { stats: WrappedStats }) {
  if (stats.topDecade == null) return null
  const bars = stats.decades.map((d) => ({
    label: `'${d.label.slice(2, 4)}`,
    value: d.count,
    title: `${d.label}: ${d.count} films`,
    highlight: parseInt(d.label) === stats.topDecade,
  }))
  return (
    <SlideBody>
      <Reveal>
        <Kicker>Your cinematic era</Kicker>
      </Reveal>
      <Reveal className="mt-4">
        <p className="font-display text-[6.5rem] font-extrabold leading-none tracking-tighter">{stats.topDecade}s</p>
        <p className="mt-3 text-lg opacity-90">{eraLine(stats.topDecade)}</p>
      </Reveal>
      <Reveal className="mt-8">
        <ColumnChart bars={bars} className="h-40" />
      </Reveal>
      {stats.oldestFilm && stats.newestFilm && stats.oldestFilm.year !== stats.newestFilm.year && (
        <Reveal className="mt-auto rounded-3xl bg-black/20 p-5">
          <Headline className="text-2xl">
            {stats.newestFilm.year - stats.oldestFilm.year} years of cinema
          </Headline>
          <p className="mt-2 text-sm opacity-90">
            From <strong>{stats.oldestFilm.name}</strong> ({stats.oldestFilm.year}) to{' '}
            <strong>{stats.newestFilm.name}</strong> ({stats.newestFilm.year}).
          </p>
        </Reveal>
      )}
    </SlideBody>
  )
}
