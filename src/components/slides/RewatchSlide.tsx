import type { WrappedStats } from '../../lib/stats'
import { CountUp, Headline, Kicker, Reveal, SlideBody } from './primitives'

export default function RewatchSlide({ stats }: { stats: WrappedStats }) {
  const max = Math.max(1, ...stats.topTags.map((t) => t.count))
  return (
    <SlideBody>
      <Reveal>
        <Kicker>Old favourites</Kicker>
      </Reveal>
      <Reveal className="mt-4">
        <CountUp value={stats.rewatchCount} className="block font-display text-8xl font-extrabold leading-none tracking-tighter" />
        <Headline className="mt-1 text-3xl">{stats.rewatchCount === 1 ? 'rewatch' : 'rewatches'}</Headline>
      </Reveal>
      <Reveal className="mt-4">
        {stats.mostRewatched ? (
          <p className="text-lg opacity-90">
            And you couldn&rsquo;t quit <strong>{stats.mostRewatched.name}</strong>: {stats.mostRewatched.count} watches.
          </p>
        ) : (
          <p className="text-lg opacity-90">
            {stats.rewatchCount ? 'Familiar faces, new perspective.' : 'Always forward, never back. Every film was a first date.'}
          </p>
        )}
      </Reveal>

      <Reveal className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest opacity-75">Most-used tags</p>
        {stats.topTags.length ? (
          <ul className="flex flex-wrap gap-2">
            {stats.topTags.map((t) => (
              <li
                key={t.label}
                className="rounded-full bg-black/25 px-4 py-1.5 font-semibold"
                style={{ fontSize: `${0.85 + (t.count / max) * 0.5}rem` }}
              >
                #{t.label} <span className="opacity-60">{t.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="opacity-80">No tags this time. Minimalist logging, we see you.</p>
        )}
      </Reveal>

      <Reveal className="mt-auto grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-black/20 p-4">
          <p className="font-display text-3xl font-extrabold">♥ {stats.likedCount}</p>
          <p className="text-sm opacity-80">{stats.likedCount === 1 ? 'film' : 'films'} you loved</p>
        </div>
        <div className="rounded-3xl bg-black/20 p-4">
          <p className="font-display text-3xl font-extrabold">✎ {stats.reviewCount}</p>
          <p className="text-sm opacity-80">{stats.reviewCount === 1 ? 'review' : 'reviews'} written</p>
        </div>
      </Reveal>
    </SlideBody>
  )
}
