import { useEffect, useRef, type ReactNode } from 'react'
import { animate, motion, useInView, type Variants } from 'framer-motion'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 140, damping: 18 } },
}

/** Full-bleed slide body; children wrapped in <Reveal> animate in one after another. */
export function SlideBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`flex h-full flex-col px-6 pb-8 pt-24 sm:px-8 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Reveal({ children, className = '', as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Tag = as === 'li' ? motion.li : motion.div
  return (
    <Tag variants={item} className={className}>
      {children}
    </Tag>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-display text-sm font-bold uppercase tracking-[0.2em] opacity-80">{children}</p>
}

export function Headline({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display text-4xl font-extrabold leading-[0.95] tracking-tight ${className}`}>{children}</h2>
}

/** A number that counts up from zero when it appears. */
export function CountUp({ value, decimals = 0, className = '' }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      },
    })
    return () => controls.stop()
  }, [value, decimals, inView])
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {(0).toFixed(decimals)}
    </span>
  )
}

export interface Bar {
  label: string
  value: number
  /** Accessible description, e.g. "October: 31 films". */
  title: string
  highlight?: boolean
}

/** Vertical single-series bars. The highlighted bar carries the slide's point. */
export function ColumnChart({ bars, className = 'h-32' }: { bars: Bar[]; className?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <figure className={className}>
      <div className="flex h-full items-end gap-[2px]" role="list">
        {bars.map((b, i) => (
          <div key={b.title} role="listitem" aria-label={b.title} title={b.title} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <motion.div
              className={`w-full rounded-t-[4px] ${b.highlight ? 'bg-current' : 'bg-current opacity-35'}`}
              initial={{ height: 0 }}
              animate={{ height: `${(b.value / max) * 100}%` }}
              transition={{ delay: 0.4 + i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              style={{ minHeight: b.value > 0 ? 3 : 0 }}
            />
            <span className={`text-[10px] font-semibold leading-none ${b.highlight ? '' : 'opacity-60'}`}>{b.label}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

/** Horizontal ranked bars with the label and value as text. */
export function RankedBars({ items, accent = 'bg-current' }: { items: { label: string; count: number }[]; accent?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ol className="space-y-2.5">
      {items.map((it, i) => (
        <li key={it.label} className="relative">
          <div className="flex items-baseline justify-between gap-3 text-sm font-semibold">
            <span className="truncate">
              <span className="mr-2 opacity-60">{i + 1}</span>
              {it.label}
            </span>
            <span className="tabular-nums opacity-80">{it.count}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/15">
            <motion.div
              className={`h-full rounded-full ${accent}`}
              initial={{ width: 0 }}
              animate={{ width: `${(it.count / max) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 80, damping: 18 }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
