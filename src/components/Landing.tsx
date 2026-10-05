import { useRef, useState, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { Wordmark } from './Logo'

interface Props {
  error?: string
  onFiles: (files: File[]) => Promise<void>
  onSample: () => void
}

export default function Landing({ error, onFiles, onSample }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    await onFiles([...files])
    setBusy(false)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void handle(e.dataTransfer.files)
  }

  return (
    <main className="relative min-h-full overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-flare/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 size-[32rem] rounded-full bg-violet/50 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-1/3 size-48 rounded-full bg-tangerine/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <Wordmark className="text-xl" />

        <motion.h1
          className="mt-12 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          Your year in film,{' '}
          <span className="bg-gradient-to-r from-flare via-tangerine to-lime bg-clip-text text-transparent">wrapped.</span>
        </motion.h1>
        <p className="mt-5 text-lg text-cream/75">
          Drop in your Letterboxd export and get a swipeable story of everything you watched. It all runs in your
          browser, and your data never leaves your device.
        </p>

        <motion.button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`mt-10 flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? 'border-lime bg-lime/10' : 'border-cream/30 bg-white/5 hover:border-cream/60'
          }`}
        >
          <span className="text-4xl" aria-hidden>
            🎞️
          </span>
          <span className="font-display text-2xl font-bold">{busy ? 'Reading your films…' : 'Drop your export ZIP'}</span>
          <span className="text-sm text-cream/60">or tap to choose the ZIP or individual CSV files</span>
        </motion.button>
        <input
          ref={input}
          type="file"
          accept=".zip,.csv"
          multiple
          className="hidden"
          onChange={(e) => {
            void handle(e.target.files)
            e.target.value = ''
          }}
        />

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-flare/20 px-4 py-3 text-sm text-cream">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onSample}
          className="mt-4 rounded-full bg-cream px-6 py-4 font-display text-lg font-bold text-ink transition hover:bg-lime"
        >
          No export handy? Try the demo →
        </button>

        <details className="mt-10 rounded-2xl bg-white/5 px-5 py-4 text-sm text-cream/75">
          <summary className="cursor-pointer font-semibold text-cream">How do I get my Letterboxd export?</summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            <li>Sign in at letterboxd.com on a computer or mobile browser.</li>
            <li>Go to Settings → Data, then choose Export Your Data.</li>
            <li>Download the ZIP and drop it above. No need to unzip it.</li>
          </ol>
          <p className="mt-3">
            FilmWrapped reads <code>diary.csv</code>, <code>ratings.csv</code>, <code>watched.csv</code>,{' '}
            <code>reviews.csv</code> and <code>likes/films.csv</code>. Any of them can be missing.
          </p>
        </details>

        <p className="mt-auto pt-10 text-xs text-cream/40">
          FilmWrapped is an independent fan project and isn't affiliated with Letterboxd.
        </p>
      </div>
    </main>
  )
}
