import type { WrappedStats } from './stats'

export interface Personality {
  title: string
  description: string
  /** Short facts that justify the label. */
  traits: string[]
}

const GENRE_NOUNS: Record<string, [string, string]> = {
  Horror: ['Horror Fiend', 'You go looking for the thing under the bed.'],
  Comedy: ['Laugh Track Junkie', 'A good time is the whole point, and you know it.'],
  Drama: ['Drama Devotee', 'You like your feelings big and your endings earned.'],
  'Science Fiction': ['Star Gazer', 'Other worlds, other timelines, other you.'],
  Animation: ['Frame-by-Frame Romantic', 'Hand-drawn or pixel-perfect, you see the craft.'],
  Documentary: ['Truth Seeker', 'Real stories hit different, and you keep coming back.'],
  Action: ['Adrenaline Chaser', 'Explosions, chases, one last job. Always one last job.'],
  Romance: ['Hopeless Romantic', 'You believe in the meet-cute. Every single time.'],
  Thriller: ['Edge-of-Seat Sitter', 'You live for the twist you almost saw coming.'],
  Crime: ['Case Cracker', 'Heists, detectives, and morally grey everything.'],
  Fantasy: ['Myth Wanderer', 'Give you a map, a quest and a dragon or two.'],
  Mystery: ['Clue Collector', 'You had a suspect by the second act.'],
  Adventure: ['Map Unfolder', 'Somewhere out there is the next horizon.'],
  War: ['History Buff', 'You go where the stakes are highest.'],
  Music: ['Soundtrack Soul', 'If it has a needle drop, you are in.'],
  Family: ['Cozy Couch Captain', 'Blanket, snacks, everyone welcome.'],
  History: ['Time Traveller', 'Period pieces are your passport.'],
  Western: ['Frontier Drifter', 'Dusty roads, long shadows, slow fuses.'],
}

/**
 * Derive a playful "film personality" from the stats.
 * The adjective describes *how* you watch; the noun describes *what* you watch.
 */
export function derivePersonality(s: WrappedStats): Personality {
  const traits: string[] = []

  let adjective: string
  if (s.totalFilms >= 250) {
    adjective = 'Relentless'
    traits.push(`${s.totalFilms} films logged`)
  } else if ((s.longestStreak?.days ?? 0) >= 7) {
    adjective = 'Binge-Prone'
    traits.push(`${s.longestStreak!.days}-day streak`)
  } else if (s.averageRating != null && s.ratedCount >= 5 && s.averageRating <= 2.75) {
    adjective = 'Hard-to-Please'
    traits.push(`${s.averageRating.toFixed(1)}★ average`)
  } else if (s.averageRating != null && s.ratedCount >= 5 && s.averageRating >= 4) {
    adjective = 'Starry-Eyed'
    traits.push(`${s.averageRating.toFixed(1)}★ average`)
  } else if (s.totalFilms >= 10 && s.weekendShare >= 0.5) {
    adjective = 'Weekend'
    traits.push(`${Math.round(s.weekendShare * 100)}% on weekends`)
  } else if (s.topDecade != null && s.topDecade < 1980) {
    adjective = 'Vintage'
    traits.push(`mostly ${s.topDecade}s films`)
  } else {
    adjective = 'Curious'
    traits.push(`${s.uniqueFilms} different films`)
  }

  let noun: string
  let description: string
  const topGenre = s.topGenres[0]?.label
  const rewatchShare = s.totalFilms ? s.rewatchCount / s.totalFilms : 0

  if (topGenre && GENRE_NOUNS[topGenre]) {
    ;[noun, description] = GENRE_NOUNS[topGenre]
    traits.push(`${topGenre} on top`)
  } else if (topGenre) {
    noun = `${topGenre} Loyalist`
    description = `When in doubt, you reach for ${topGenre.toLowerCase()}.`
    traits.push(`${topGenre} on top`)
  } else if (s.totalFilms >= 5 && rewatchShare >= 0.25) {
    noun = 'Comfort Rewatcher'
    description = 'You know the good ones, and you go back to them.'
    traits.push(`${Math.round(rewatchShare * 100)}% rewatches`)
  } else if (s.topDecade != null && s.topDecade < 1980) {
    noun = 'Archive Diver'
    description = 'Old prints, restored classics, long-lost gems.'
    if (adjective !== 'Vintage') traits.push(`mostly ${s.topDecade}s films`)
  } else if (s.topDecade != null && s.topDecade >= 2020) {
    noun = 'New Release Chaser'
    description = 'Opening weekend is basically a holiday for you.'
    traits.push(`mostly ${s.topDecade}s films`)
  } else {
    noun = 'Film Wanderer'
    description = 'No single lane: you go wherever the next good film is.'
  }

  if (adjective === 'Vintage' && noun === 'Archive Diver') adjective = 'Devoted'

  return { title: `The ${adjective} ${noun}`, description, traits }
}
