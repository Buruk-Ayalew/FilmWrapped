import type { WrappedStats } from '../../lib/stats'
import { Headline, Kicker, RankedBars, Reveal, SlideBody } from './primitives'

export default function GenresSlide({ stats }: { stats: WrappedStats }) {
  const top = stats.topGenres[0]
  return (
    <SlideBody>
      <Reveal>
        <Kicker>Your comfort zone</Kicker>
      </Reveal>
      <Reveal className="mt-4">
        <Headline>{top ? <>You kept coming back to {top.label.toLowerCase()}.</> : 'A genre-fluid year.'}</Headline>
      </Reveal>
      <Reveal className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-75">Top genres</p>
        <RankedBars items={stats.topGenres} accent="bg-ink" />
      </Reveal>
      {stats.topDirectors.length > 0 && (
        <Reveal className="mt-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-75">Top directors</p>
          <RankedBars items={stats.topDirectors} accent="bg-ink" />
        </Reveal>
      )}
    </SlideBody>
  )
}
