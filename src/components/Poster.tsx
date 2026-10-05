import { useState } from 'react'

const GRADIENTS = [
  ['#ff4d8d', '#7b2ff7'],
  ['#ff8a3d', '#e11d48'],
  ['#4cc9f0', '#4338ca'],
  ['#c6f432', '#059669'],
  ['#fbbf24', '#db2777'],
  ['#a78bfa', '#0f172a'],
]

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** TMDB poster when available, otherwise a generated title card. */
export default function Poster({ name, year, url, className = '' }: { name: string; year: number | null; url: string | null; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`Poster for ${name}`}
        crossOrigin="anonymous"
        loading="lazy"
        onError={() => setFailed(true)}
        className={`object-cover shadow-lg shadow-black/30 ${className}`}
      />
    )
  }
  const [from, to] = GRADIENTS[hash(`${name}${year}`) % GRADIENTS.length]
  return (
    <div
      aria-hidden
      className={`flex items-end overflow-hidden p-1 shadow-lg shadow-black/30 ${className}`}
      style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <span className="line-clamp-3 font-display text-[9px] font-extrabold uppercase leading-tight text-white">{name}</span>
    </div>
  )
}
