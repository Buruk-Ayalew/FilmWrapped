import { useEffect, useRef, useState } from 'react'

interface Props {
  count: number
  index: number
  /** Time per slide in ms. */
  duration: number
  running: boolean
  onComplete: () => void
}

/** Segmented story progress. The current segment fills over `duration` while running. */
export default function ProgressBar({ count, index, duration, running, onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const elapsed = useRef(0)
  const done = useRef(onComplete)
  done.current = onComplete

  useEffect(() => {
    elapsed.current = 0
    setProgress(0)
  }, [index])

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      elapsed.current += now - last
      last = now
      const p = Math.min(1, elapsed.current / duration)
      setProgress(p)
      if (p >= 1) done.current()
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, duration, index])

  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${i < index || (i === index && index === count - 1) ? 100 : i === index ? progress * 100 : 0}%` }}
          />
        </div>
      ))}
    </div>
  )
}
