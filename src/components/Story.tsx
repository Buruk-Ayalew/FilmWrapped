import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Personality } from '../lib/personality'
import type { WrappedStats } from '../lib/stats'
import { LogoMark } from './Logo'
import ProgressBar from './ProgressBar'
import DecadesSlide from './slides/DecadesSlide'
import GenresSlide from './slides/GenresSlide'
import PersonalitySlide from './slides/PersonalitySlide'
import RatingsSlide from './slides/RatingsSlide'
import RewatchSlide from './slides/RewatchSlide'
import ShareSlide from './slides/ShareSlide'
import TimingSlide from './slides/TimingSlide'
import TopFilmsSlide from './slides/TopFilmsSlide'
import TotalSlide from './slides/TotalSlide'

const SLIDE_MS = 9000
const SWIPE_PX = 50
const TAP_MS = 250

interface SlideDef {
  id: string
  /** Background gradient and text colour for the slide. */
  theme: string
  node: ReactNode
}

interface Props {
  stats: WrappedStats
  personality: Personality
  onExit: () => void
}

function useSlides(stats: WrappedStats, personality: Personality, replay: () => void, exit: () => void): SlideDef[] {
  return useMemo(() => {
    const slides: (SlideDef | false)[] = [
      { id: 'total', theme: 'bg-gradient-to-br from-violet via-[#b4237f] to-flare text-cream', node: <TotalSlide stats={stats} /> },
      stats.busiestMonth != null && {
        id: 'timing',
        theme: 'bg-gradient-to-b from-tangerine via-[#f0513b] to-[#b5123e] text-cream',
        node: <TimingSlide stats={stats} />,
      },
      { id: 'ratings', theme: 'bg-gradient-to-br from-[#0f766e] via-[#1e3a8a] to-[#312e81] text-cream', node: <RatingsSlide stats={stats} /> },
      stats.topFilms.length > 0 && {
        id: 'top',
        theme: 'bg-gradient-to-b from-[#1a0b2e] via-[#4a0d4f] to-flare text-cream',
        node: <TopFilmsSlide stats={stats} />,
      },
      stats.enriched &&
        stats.topGenres.length > 0 && {
          id: 'genres',
          theme: 'bg-gradient-to-br from-lime via-[#7ee081] to-[#14b8a6] text-ink',
          node: <GenresSlide stats={stats} />,
        },
      { id: 'rewatch', theme: 'bg-gradient-to-b from-sky via-[#6d5dfc] to-violet text-cream', node: <RewatchSlide stats={stats} /> },
      stats.topDecade != null && {
        id: 'decades',
        theme: 'bg-gradient-to-br from-[#fbbf24] via-tangerine to-[#e11d48] text-ink',
        node: <DecadesSlide stats={stats} />,
      },
      {
        id: 'personality',
        theme: 'bg-[radial-gradient(circle_at_30%_20%,#c6f432_0%,#4cc9f0_30%,#7b2ff7_65%,#120a24_100%)] text-cream',
        node: <PersonalitySlide personality={personality} />,
      },
      {
        id: 'share',
        theme: 'bg-gradient-to-b from-ink via-[#2a1250] to-[#120a24] text-cream',
        node: <ShareSlide stats={stats} personality={personality} onReplay={replay} onExit={exit} />,
      },
    ]
    return slides.filter((s): s is SlideDef => s !== false)
  }, [stats, personality, replay, exit])
}

export default function Story({ stats, personality, onExit }: Props) {
  const [[index, direction], setPosition] = useState<[number, number]>([0, 1])
  const [paused, setPaused] = useState(false)
  const [held, setHeld] = useState(false)
  const replay = useCallback(() => setPosition([0, -1]), [])
  const slides = useSlides(stats, personality, replay, onExit)
  const last = slides.length - 1

  const go = useCallback(
    (delta: number) => setPosition(([i]) => [Math.max(0, Math.min(last, i + delta)), delta]),
    [last],
  )

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onExit()
      else if (e.key.toLowerCase() === 'p') setPaused((p) => !p)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onExit])

  // Tap left/right, swipe, or press and hold to pause.
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const isControl = (e: PointerEvent) => (e.target as Element).closest('button, a, input, [data-no-nav]') != null
  const onPointerDown = (e: PointerEvent) => {
    if (isControl(e)) return
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    setHeld(true)
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setHeld(false)
    const s = start.current
    start.current = null
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1)
    } else if (performance.now() - s.t < TAP_MS && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = e.currentTarget.getBoundingClientRect()
      go(e.clientX - rect.left < rect.width / 3 ? -1 : 1)
    }
  }

  const slide = slides[index]
  const autoplay = !paused && !held && index < last

  return (
    <div className="flex h-dvh items-center justify-center overflow-hidden bg-ink sm:py-4">
      <div
        className="relative h-full w-full touch-none select-none overflow-hidden sm:aspect-[9/16] sm:h-[min(100%,900px)] sm:w-auto sm:rounded-[28px] sm:shadow-2xl sm:shadow-black/60"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          setHeld(false)
          start.current = null
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Your FilmWrapped story"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.section
            key={slide.id}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: `${d * 30}%`, opacity: 0, scale: 0.94 }),
              center: { x: 0, opacity: 1, scale: 1 },
              exit: (d: number) => ({ x: `${d * -30}%`, opacity: 0, scale: 0.94 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={`grain absolute inset-0 ${slide.theme}`}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
          >
            {slide.node}
          </motion.section>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 z-10 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <ProgressBar count={slides.length} index={index} duration={SLIDE_MS} running={autoplay} onComplete={() => go(1)} />
          <div className="mt-3 flex items-center justify-between text-cream mix-blend-difference">
            <span className="flex items-center gap-1.5 font-display text-sm font-extrabold">
              <LogoMark className="size-5" /> FilmWrapped
            </span>
            <div data-no-nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Play' : 'Pause'}
                className="grid size-9 place-items-center rounded-full text-lg hover:bg-white/15"
              >
                {paused ? '▶' : '❚❚'}
              </button>
              <button
                type="button"
                onClick={onExit}
                aria-label="Close story"
                className="grid size-9 place-items-center rounded-full text-xl hover:bg-white/15"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
