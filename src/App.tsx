import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from './components/Landing'
import Setup from './components/Setup'
import Story from './components/Story'
import { sampleExport, sampleMeta } from './data/sample'
import { readExportFiles } from './lib/loadFiles'
import { buildExport, filmKey } from './lib/parse'
import { derivePersonality, type Personality } from './lib/personality'
import { computeStats, filterByPeriod, type WrappedStats } from './lib/stats'
import { enrichFilms, tmdbApiKey } from './lib/tmdb'
import type { MetaLookup, ParsedExport, Period } from './lib/types'

export interface LoadedExport {
  parsed: ParsedExport
  isSample: boolean
}

type Stage =
  | { kind: 'landing'; error?: string }
  | { kind: 'setup'; data: LoadedExport; progress?: { done: number; total: number } }
  | { kind: 'story'; data: LoadedExport; stats: WrappedStats; personality: Personality }

export default function App() {
  const [stage, setStage] = useState<Stage>({ kind: 'landing' })

  const load = async (files: File[]) => {
    try {
      const parsed = buildExport(await readExportFiles(files))
      if (parsed.entries.length === 0) {
        setStage({ kind: 'landing', error: parsed.warnings[0] ?? 'No films found in those files.' })
        return
      }
      setStage({ kind: 'setup', data: { parsed, isSample: false } })
    } catch {
      setStage({ kind: 'landing', error: "We couldn't read that file. Is it the ZIP from Letterboxd's export page?" })
    }
  }

  const loadSample = () => setStage({ kind: 'setup', data: { parsed: buildExport(sampleExport()), isSample: true } })

  const start = async (data: LoadedExport, period: Period, enrich: boolean) => {
    let meta: MetaLookup | undefined
    const apiKey = tmdbApiKey()
    if (data.isSample) {
      meta = sampleMeta()
    } else if (enrich && apiKey) {
      const films = filterByPeriod(data.parsed.entries, period)
      setStage({ kind: 'setup', data, progress: { done: 0, total: new Set(films.map((f) => filmKey(f.name, f.year))).size } })
      meta = await enrichFilms(films, {
        apiKey,
        onProgress: (done, total) => setStage({ kind: 'setup', data, progress: { done, total } }),
      })
    }
    const stats = computeStats(data.parsed.entries, period, { meta, reviews: data.parsed.reviews })
    setStage({ kind: 'story', data, stats, personality: derivePersonality(stats) })
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage.kind}
        className="h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {stage.kind === 'landing' && <Landing error={stage.error} onFiles={load} onSample={loadSample} />}
        {stage.kind === 'setup' && (
          <Setup
            data={stage.data}
            progress={stage.progress}
            canEnrich={!stage.data.isSample && tmdbApiKey() != null}
            onStart={(period, enrich) => start(stage.data, period, enrich)}
            onBack={() => setStage({ kind: 'landing' })}
          />
        )}
        {stage.kind === 'story' && (
          <Story
            stats={stage.stats}
            personality={stage.personality}
            onExit={() => setStage({ kind: 'setup', data: stage.data })}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
