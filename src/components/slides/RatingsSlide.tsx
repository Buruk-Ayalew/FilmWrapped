import { MONTHS, type WrappedStats } from '../../lib/stats'
import { ColumnChart, CountUp, Headline, Kicker, Reveal, SlideBody } from './primitives'

function verdict(avg: number): string {
  if (avg >= 4) return 'Generous to a fault. Every film is somebody’s favourite.'
  if (avg >= 3.5) return 'You know what you like, and you found a lot of it.'
  if (avg >= 2.75) return 'Fair but firm. Stars are earned, not given.'
  return 'Tough crowd. Directors fear your logbook.'
}

export default function RatingsSlide({ stats }: { stats: WrappedStats }) {
  const { averageRating, harshestMonth, mostGenerousMonth } = stats
  if (averageRating == null) {
    return (
      <SlideBody>
        <Reveal>
          <Kicker>How you rated</Kicker>
        </Reveal>
        <Reveal className="mt-6">
          <Headline>Zero stars given.</Headline>
          <p className="mt-4 text-lg opacity-90">
            {stats.totalFilms} films watched, not a single rating. A true enigma: you just let the films speak.
          </p>
        </Reveal>
      </SlideBody>
    )
  }

  const peak = stats.ratingDistribution.indexOf(Math.max(...stats.ratingDistribution))
  const bars = stats.ratingDistribution.map((value, i) => {
    const stars = (i + 1) / 2
    return { label: stars === 0.5 ? '½' : stars % 1 ? `${Math.floor(stars)}½` : `${stars}`, value, title: `${stars} stars: ${value} films`, highlight: i === peak }
  })

  return (
    <SlideBody>
      <Reveal>
        <Kicker>How you rated</Kicker>
      </Reveal>
      <Reveal className="mt-6 flex items-end gap-3">
        <CountUp value={averageRating} decimals={2} className="font-display text-8xl font-extrabold leading-none tracking-tighter" />
        <span className="pb-2 font-display text-3xl font-bold">★ avg</span>
      </Reveal>
      <Reveal className="mt-3">
        <p className="text-lg opacity-90">{verdict(averageRating)}</p>
      </Reveal>
      <Reveal className="mt-6">
        <ColumnChart bars={bars} className="h-32" />
        <p className="mt-1 text-right text-xs opacity-70">{stats.ratedCount} ratings, ½★ to 5★</p>
      </Reveal>
      {harshestMonth && mostGenerousMonth && (
        <div className="mt-auto grid grid-cols-2 gap-3">
          <Reveal className="rounded-3xl bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">Harshest month</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{MONTHS[harshestMonth.month]}</p>
            <p className="text-sm opacity-80">{harshestMonth.average.toFixed(2)}★ average</p>
          </Reveal>
          <Reveal className="rounded-3xl bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">Most generous</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{MONTHS[mostGenerousMonth.month]}</p>
            <p className="text-sm opacity-80">{mostGenerousMonth.average.toFixed(2)}★ average</p>
          </Reveal>
        </div>
      )}
    </SlideBody>
  )
}
