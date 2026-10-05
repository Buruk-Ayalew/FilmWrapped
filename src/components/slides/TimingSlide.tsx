import { formatShortDate } from '../../lib/format'
import { MONTHS, WEEKDAYS, type WrappedStats } from '../../lib/stats'
import { ColumnChart, Headline, Kicker, Reveal, SlideBody } from './primitives'

export default function TimingSlide({ stats }: { stats: WrappedStats }) {
  const { busiestMonth, busiestWeekday, longestStreak } = stats
  if (!busiestMonth || !busiestWeekday) return null
  const bars = stats.byMonth.map((value, i) => ({
    label: MONTHS[i][0],
    value,
    title: `${MONTHS[i]}: ${value} films`,
    highlight: i === busiestMonth.month,
  }))
  return (
    <SlideBody>
      <Reveal>
        <Kicker>When you watched</Kicker>
      </Reveal>
      <Reveal className="mt-6">
        <Headline>
          {MONTHS[busiestMonth.month]} was <br />
          your peak month.
        </Headline>
        <p className="mt-3 text-lg opacity-90">
          {busiestMonth.count} films. The popcorn budget never recovered.
        </p>
      </Reveal>
      <Reveal className="mt-8">
        <ColumnChart bars={bars} className="h-36" />
      </Reveal>
      <div className="mt-auto grid grid-cols-2 gap-3">
        <Reveal className="rounded-3xl bg-black/20 p-4">
          <p className="text-xs font-bold uppercase tracking-widest opacity-75">Favourite day</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{WEEKDAYS[busiestWeekday.day]}s</p>
          <p className="text-sm opacity-80">{busiestWeekday.count} films</p>
        </Reveal>
        {longestStreak && (
          <Reveal className="rounded-3xl bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-widest opacity-75">Longest streak</p>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {longestStreak.days} {longestStreak.days === 1 ? 'day' : 'days'}
            </p>
            <p className="text-sm opacity-80">
              {longestStreak.days > 1
                ? `${formatShortDate(longestStreak.start)} – ${formatShortDate(longestStreak.end)}`
                : 'Pacing yourself. Respect.'}
            </p>
          </Reveal>
        )}
      </div>
    </SlideBody>
  )
}
