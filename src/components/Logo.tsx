/** FilmWrapped's mark: a film frame with sprocket holes wrapped around a star. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fw-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d8d" />
          <stop offset="1" stopColor="#7b2ff7" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#fw-mark)" />
      <g fill="#120a24">
        {[12, 23, 36, 47].map((y) => (
          <g key={y}>
            <rect x="12" y={y} width="6" height="5" rx="1.5" />
            <rect x="46" y={y} width="6" height="5" rx="1.5" />
          </g>
        ))}
      </g>
      <path d="M32 20l3.5 7.6 8.3.9-6.2 5.6 1.8 8.2L32 38.1l-7.4 4.2 1.8-8.2-6.2-5.6 8.3-.9z" fill="#fff4d6" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}>
      <LogoMark className="size-[1.4em]" />
      FilmWrapped
    </span>
  )
}
