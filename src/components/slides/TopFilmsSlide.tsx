import { formatStars } from '../../lib/format'
import type { WrappedStats } from '../../lib/stats'
import Poster from '../Poster'
import { Headline, Kicker, Reveal, SlideBody } from './primitives'

export default function TopFilmsSlide({ stats }: { stats: WrappedStats }) {
  return (
    <SlideBody>
      <Reveal>
        <Kicker>Your top {stats.topFilms.length}</Kicker>
      </Reveal>
      <Reveal className="mt-4">
        <Headline>The ones that got you.</Headline>
      </Reveal>
      <ol className="mt-6 flex flex-1 flex-col justify-center gap-3">
        {stats.topFilms.map((f, i) => (
          <Reveal as="li" key={`${f.name}-${f.year}`} className="flex items-center gap-4">
              <span className="w-7 shrink-0 font-display text-4xl font-extrabold opacity-90">{i + 1}</span>
              <Poster name={f.name} year={f.year} url={f.posterUrl} className="h-[4.5rem] w-12 shrink-0 rounded-md" />
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold leading-tight">{f.name}</p>
                <p className="text-sm opacity-80">
                  {f.year ?? '—'} · <span className="text-lime">{formatStars(f.rating)}</span>
                  {f.liked && <span aria-label="liked"> · ♥</span>}
                  {f.watches > 1 && <span> · {f.watches}×</span>}
                </p>
              </div>
          </Reveal>
        ))}
      </ol>
    </SlideBody>
  )
}
