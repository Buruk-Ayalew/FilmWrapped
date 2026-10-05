import { useRef, useState } from 'react'
import type { Personality } from '../../lib/personality'
import type { WrappedStats } from '../../lib/stats'
import ShareCard from '../ShareCard'
import { Kicker, Reveal, SlideBody } from './primitives'

interface Props {
  stats: WrappedStats
  personality: Personality
  onReplay: () => void
  onExit: () => void
}

export default function ShareSlide({ stats, personality, onReplay, onExit }: Props) {
  const card = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const fileName = `filmwrapped-${stats.period}.png`

  const render = async () => {
    if (!card.current) throw new Error('Card not mounted')
    const [{ toPng }] = await Promise.all([import('html-to-image'), document.fonts.ready])
    return toPng(card.current, { pixelRatio: 4, cacheBust: true })
  }

  const download = async () => {
    setStatus('working')
    try {
      const a = document.createElement('a')
      a.href = await render()
      a.download = fileName
      a.click()
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const share = async () => {
    setStatus('working')
    try {
      const blob = await (await fetch(await render())).blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My FilmWrapped' })
      } else {
        await download()
        return
      }
      setStatus('idle')
    } catch (e) {
      // The user dismissing the share sheet is not an error.
      setStatus(e instanceof DOMException && e.name === 'AbortError' ? 'idle' : 'error')
    }
  }

  const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator

  return (
    <SlideBody className="items-center pt-20">
      <Reveal>
        <Kicker>That&rsquo;s a wrap</Kicker>
      </Reveal>
      <Reveal className="mt-4 [@media(max-height:760px)]:[zoom:0.82]">
        <ShareCard ref={card} stats={stats} personality={personality} />
      </Reveal>
      <Reveal className="mt-5 flex w-full max-w-[270px] flex-col gap-2">
        <div data-no-nav className="flex gap-2">
          <button
            type="button"
            onClick={download}
            disabled={status === 'working'}
            className="flex-1 rounded-full bg-cream px-4 py-3 font-display font-extrabold text-ink transition hover:bg-lime disabled:opacity-60"
          >
            {status === 'working' ? 'Rendering…' : 'Download PNG'}
          </button>
          {canShareFiles && (
            <button
              type="button"
              onClick={share}
              disabled={status === 'working'}
              className="rounded-full bg-ink/40 px-4 py-3 font-display font-extrabold transition hover:bg-ink/60 disabled:opacity-60"
            >
              Share
            </button>
          )}
        </div>
        {status === 'error' && <p className="text-center text-sm">Couldn&rsquo;t render the image. Try again?</p>}
        <div data-no-nav className="flex justify-center gap-4 text-sm font-semibold opacity-90">
          <button type="button" onClick={onReplay} className="underline-offset-4 hover:underline">
            ↺ Watch again
          </button>
          <button type="button" onClick={onExit} className="underline-offset-4 hover:underline">
            Pick another year
          </button>
        </div>
      </Reveal>
    </SlideBody>
  )
}
