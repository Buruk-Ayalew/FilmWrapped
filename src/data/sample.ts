import Papa from 'papaparse'
import { filmKey, type ExportFiles } from '../lib/parse'
import type { FilmMeta, MetaLookup } from '../lib/types'

/**
 * A fictional viewer's Letterboxd export, generated deterministically so the demo
 * runs through the exact same parsing pipeline as a real upload. Films carry
 * bundled metadata, so the demo shows genre and director slides without a TMDB key.
 */

type SampleFilm = [name: string, year: number, runtime: number, genres: string[], director: string, base: number]

const FILMS: SampleFilm[] = [
  ['Hereditary', 2018, 127, ['Horror', 'Drama'], 'Ari Aster', 4.5],
  ['The Thing', 1982, 109, ['Horror', 'Science Fiction'], 'John Carpenter', 5],
  ['Halloween', 1978, 91, ['Horror', 'Thriller'], 'John Carpenter', 4],
  ['Get Out', 2017, 104, ['Horror', 'Mystery'], 'Jordan Peele', 4.5],
  ['Nope', 2022, 130, ['Horror', 'Science Fiction'], 'Jordan Peele', 4],
  ['The Shining', 1980, 144, ['Horror', 'Thriller'], 'Stanley Kubrick', 5],
  ['Rosemary\'s Baby', 1968, 137, ['Horror', 'Drama'], 'Roman Polanski', 4.5],
  ['The Witch', 2015, 92, ['Horror', 'Fantasy'], 'Robert Eggers', 4],
  ['Midsommar', 2019, 148, ['Horror', 'Drama'], 'Ari Aster', 4],
  ['It Follows', 2014, 100, ['Horror', 'Mystery'], 'David Robert Mitchell', 4],
  ['The Babadook', 2014, 94, ['Horror', 'Drama'], 'Jennifer Kent', 3.5],
  ['Scream', 1996, 111, ['Horror', 'Mystery'], 'Wes Craven', 4],
  ['Suspiria', 1977, 99, ['Horror'], 'Dario Argento', 4],
  ['Talk to Me', 2023, 95, ['Horror', 'Thriller'], 'Danny Philippou', 3.5],
  ['Longlegs', 2024, 101, ['Horror', 'Crime'], 'Osgood Perkins', 3],
  ['Nosferatu', 2024, 132, ['Horror', 'Fantasy'], 'Robert Eggers', 4],
  ['The Substance', 2024, 141, ['Horror', 'Science Fiction'], 'Coralie Fargeat', 4],
  ['Alien', 1979, 117, ['Horror', 'Science Fiction'], 'Ridley Scott', 5],
  ['Sinners', 2025, 138, ['Horror', 'Drama'], 'Ryan Coogler', 4.5],
  ['Weapons', 2025, 128, ['Horror', 'Mystery'], 'Zach Cregger', 4],
  ['28 Years Later', 2025, 115, ['Horror', 'Thriller'], 'Danny Boyle', 3.5],
  ['Parasite', 2019, 133, ['Thriller', 'Drama', 'Comedy'], 'Bong Joon Ho', 5],
  ['Mulholland Drive', 2001, 147, ['Mystery', 'Thriller', 'Drama'], 'David Lynch', 4.5],
  ['Blue Velvet', 1986, 120, ['Mystery', 'Thriller'], 'David Lynch', 4],
  ['Zodiac', 2007, 157, ['Crime', 'Mystery', 'Thriller'], 'David Fincher', 4.5],
  ['Se7en', 1995, 127, ['Crime', 'Mystery', 'Thriller'], 'David Fincher', 4.5],
  ['Gone Girl', 2014, 149, ['Mystery', 'Thriller', 'Drama'], 'David Fincher', 4],
  ['Memories of Murder', 2003, 132, ['Crime', 'Drama', 'Thriller'], 'Bong Joon Ho', 4.5],
  ['Prisoners', 2013, 153, ['Drama', 'Thriller', 'Crime'], 'Denis Villeneuve', 4],
  ['Arrival', 2016, 116, ['Drama', 'Science Fiction', 'Mystery'], 'Denis Villeneuve', 4.5],
  ['Dune: Part Two', 2024, 167, ['Science Fiction', 'Adventure'], 'Denis Villeneuve', 4.5],
  ['Blade Runner 2049', 2017, 164, ['Science Fiction', 'Drama'], 'Denis Villeneuve', 4],
  ['Everything Everywhere All at Once', 2022, 140, ['Action', 'Adventure', 'Science Fiction'], 'Daniel Kwan', 4.5],
  ['Mad Max: Fury Road', 2015, 121, ['Action', 'Adventure', 'Science Fiction'], 'George Miller', 5],
  ['Furiosa: A Mad Max Saga', 2024, 149, ['Action', 'Adventure', 'Science Fiction'], 'George Miller', 4],
  ['The Matrix', 1999, 136, ['Action', 'Science Fiction'], 'Lana Wachowski', 4.5],
  ['Paddington 2', 2017, 104, ['Comedy', 'Family', 'Adventure'], 'Paul King', 4.5],
  ['The Grand Budapest Hotel', 2014, 100, ['Comedy', 'Drama'], 'Wes Anderson', 4],
  ['Asteroid City', 2023, 105, ['Comedy', 'Drama'], 'Wes Anderson', 3],
  ['Barbie', 2023, 114, ['Comedy', 'Adventure', 'Fantasy'], 'Greta Gerwig', 3.5],
  ['Lady Bird', 2017, 94, ['Comedy', 'Drama'], 'Greta Gerwig', 4],
  ['Little Women', 2019, 135, ['Drama', 'Romance'], 'Greta Gerwig', 4.5],
  ['Past Lives', 2023, 106, ['Drama', 'Romance'], 'Celine Song', 4.5],
  ['Before Sunrise', 1995, 101, ['Drama', 'Romance'], 'Richard Linklater', 4.5],
  ['In the Mood for Love', 2000, 98, ['Drama', 'Romance'], 'Wong Kar-wai', 5],
  ['Chungking Express', 1994, 102, ['Drama', 'Comedy', 'Romance'], 'Wong Kar-wai', 4.5],
  ['Portrait of a Lady on Fire', 2019, 122, ['Drama', 'Romance', 'History'], 'Céline Sciamma', 4.5],
  ['Aftersun', 2022, 102, ['Drama'], 'Charlotte Wells', 4.5],
  ['Anatomy of a Fall', 2023, 152, ['Crime', 'Drama', 'Mystery'], 'Justine Triet', 4],
  ['The Zone of Interest', 2023, 105, ['Drama', 'History', 'War'], 'Jonathan Glazer', 4],
  ['Oppenheimer', 2023, 181, ['Drama', 'History'], 'Christopher Nolan', 4],
  ['Anora', 2024, 139, ['Drama', 'Comedy', 'Romance'], 'Sean Baker', 4],
  ['The Brutalist', 2024, 215, ['Drama'], 'Brady Corbet', 3.5],
  ['Conclave', 2024, 120, ['Drama', 'Mystery', 'Thriller'], 'Edward Berger', 3.5],
  ['One Battle After Another', 2025, 162, ['Action', 'Crime', 'Thriller'], 'Paul Thomas Anderson', 4.5],
  ['There Will Be Blood', 2007, 158, ['Drama'], 'Paul Thomas Anderson', 5],
  ['Spirited Away', 2001, 125, ['Animation', 'Family', 'Fantasy'], 'Hayao Miyazaki', 5],
  ['Princess Mononoke', 1997, 134, ['Animation', 'Adventure', 'Fantasy'], 'Hayao Miyazaki', 4.5],
  ['Spider-Man: Into the Spider-Verse', 2018, 117, ['Animation', 'Action', 'Adventure'], 'Bob Persichetti', 4.5],
  ['Flow', 2024, 85, ['Animation', 'Fantasy', 'Adventure'], 'Gints Zilbalodis', 4],
  ['Seven Samurai', 1954, 207, ['Action', 'Drama'], 'Akira Kurosawa', 5],
  ['Vertigo', 1958, 128, ['Mystery', 'Romance', 'Thriller'], 'Alfred Hitchcock', 4.5],
  ['Psycho', 1960, 109, ['Horror', 'Thriller'], 'Alfred Hitchcock', 4.5],
  ['Rear Window', 1954, 112, ['Thriller', 'Mystery'], 'Alfred Hitchcock', 4.5],
  ['Jaws', 1975, 124, ['Horror', 'Thriller', 'Adventure'], 'Steven Spielberg', 4.5],
  ['Heat', 1995, 170, ['Crime', 'Drama', 'Action'], 'Michael Mann', 4.5],
  ['Top Gun: Maverick', 2022, 131, ['Action', 'Drama'], 'Joseph Kosinski', 3.5],
  ['Madame Web', 2024, 116, ['Action', 'Fantasy'], 'S.J. Clarkson', 1],
  ['Morbius', 2022, 104, ['Action', 'Science Fiction', 'Fantasy'], 'Daniel Espinosa', 1.5],
  ['Pulp Fiction', 1994, 154, ['Crime', 'Thriller'], 'Quentin Tarantino', 4.5],
  ['Jackie Brown', 1997, 154, ['Crime', 'Drama'], 'Quentin Tarantino', 4],
  ['Fargo', 1996, 98, ['Crime', 'Drama', 'Thriller'], 'Joel Coen', 4.5],
  ['No Country for Old Men', 2007, 122, ['Crime', 'Drama', 'Thriller'], 'Joel Coen', 4.5],
  ['The Big Lebowski', 1998, 117, ['Comedy', 'Crime'], 'Joel Coen', 4],
  ['Moonlight', 2016, 111, ['Drama'], 'Barry Jenkins', 4.5],
  ['Call Me by Your Name', 2017, 132, ['Romance', 'Drama'], 'Luca Guadagnino', 4],
  ['Challengers', 2024, 131, ['Drama', 'Romance'], 'Luca Guadagnino', 4],
  ['Suspiria', 2018, 152, ['Horror', 'Mystery'], 'Luca Guadagnino', 3],
  ['Her', 2013, 126, ['Romance', 'Science Fiction', 'Drama'], 'Spike Jonze', 4.5],
  ['Eternal Sunshine of the Spotless Mind', 2004, 108, ['Science Fiction', 'Drama', 'Romance'], 'Michel Gondry', 5],
  ['Lost in Translation', 2003, 102, ['Drama', 'Comedy', 'Romance'], 'Sofia Coppola', 4],
  ['The Social Network', 2010, 121, ['Drama'], 'David Fincher', 4.5],
  ['Fight Club', 1999, 139, ['Drama', 'Thriller'], 'David Fincher', 4],
  ['Inception', 2010, 148, ['Action', 'Science Fiction', 'Adventure'], 'Christopher Nolan', 4],
  ['Interstellar', 2014, 169, ['Adventure', 'Drama', 'Science Fiction'], 'Christopher Nolan', 4.5],
  ['The Prestige', 2006, 130, ['Drama', 'Mystery', 'Science Fiction'], 'Christopher Nolan', 4.5],
  ['Tenet', 2020, 150, ['Action', 'Thriller', 'Science Fiction'], 'Christopher Nolan', 3],
  ['2001: A Space Odyssey', 1968, 149, ['Science Fiction', 'Mystery', 'Adventure'], 'Stanley Kubrick', 5],
  ['Barry Lyndon', 1975, 185, ['Drama', 'History', 'Romance'], 'Stanley Kubrick', 4.5],
  ['Taxi Driver', 1976, 114, ['Crime', 'Drama'], 'Martin Scorsese', 4.5],
  ['Goodfellas', 1990, 145, ['Drama', 'Crime'], 'Martin Scorsese', 4.5],
  ['Killers of the Flower Moon', 2023, 206, ['Crime', 'Drama', 'History'], 'Martin Scorsese', 4],
  ['The Godfather', 1972, 175, ['Drama', 'Crime'], 'Francis Ford Coppola', 5],
  ['Apocalypse Now', 1979, 147, ['Drama', 'War'], 'Francis Ford Coppola', 4.5],
  ['Chinatown', 1974, 130, ['Crime', 'Drama', 'Mystery'], 'Roman Polanski', 4.5],
  ['Do the Right Thing', 1989, 120, ['Drama'], 'Spike Lee', 4.5],
  ['Back to the Future', 1985, 116, ['Adventure', 'Comedy', 'Science Fiction'], 'Robert Zemeckis', 4.5],
  ['Raiders of the Lost Ark', 1981, 115, ['Adventure', 'Action'], 'Steven Spielberg', 4.5],
  ['Jurassic Park', 1993, 127, ['Adventure', 'Science Fiction'], 'Steven Spielberg', 4],
  ['The Silence of the Lambs', 1991, 119, ['Crime', 'Drama', 'Thriller'], 'Jonathan Demme', 4.5],
  ['Twin Peaks: Fire Walk with Me', 1992, 135, ['Drama', 'Mystery', 'Horror'], 'David Lynch', 4],
  ['Rashomon', 1950, 88, ['Crime', 'Drama', 'Mystery'], 'Akira Kurosawa', 4.5],
  ['Tokyo Story', 1953, 136, ['Drama'], 'Yasujirō Ozu', 4.5],
  ['Perfect Days', 2023, 124, ['Drama'], 'Wim Wenders', 4.5],
  ['Paris, Texas', 1984, 145, ['Drama'], 'Wim Wenders', 4.5],
  ['Drive My Car', 2021, 179, ['Drama'], 'Ryusuke Hamaguchi', 4],
  ['Burning', 2018, 148, ['Drama', 'Mystery'], 'Lee Chang-dong', 4.5],
  ['Oldboy', 2003, 120, ['Drama', 'Thriller', 'Mystery'], 'Park Chan-wook', 4.5],
  ['The Handmaiden', 2016, 145, ['Thriller', 'Drama', 'Romance'], 'Park Chan-wook', 4.5],
  ['Decision to Leave', 2022, 138, ['Crime', 'Mystery', 'Romance'], 'Park Chan-wook', 4],
  ['Train to Busan', 2016, 118, ['Horror', 'Thriller', 'Action'], 'Yeon Sang-ho', 4],
  ['The Wailing', 2016, 156, ['Horror', 'Mystery'], 'Na Hong-jin', 4],
  ["Pan's Labyrinth", 2006, 118, ['Fantasy', 'Drama', 'War'], 'Guillermo del Toro', 4.5],
  ['Crimson Peak', 2015, 119, ['Horror', 'Drama', 'Fantasy'], 'Guillermo del Toro', 3.5],
  ['The Lighthouse', 2019, 109, ['Horror', 'Fantasy', 'Drama'], 'Robert Eggers', 4],
  ['Us', 2019, 116, ['Horror', 'Thriller'], 'Jordan Peele', 3.5],
  ['Pearl', 2022, 102, ['Horror'], 'Ti West', 3.5],
  ['X', 2022, 105, ['Horror', 'Mystery'], 'Ti West', 3.5],
  ['The Texas Chain Saw Massacre', 1974, 83, ['Horror'], 'Tobe Hooper', 4],
  ['Night of the Living Dead', 1968, 96, ['Horror'], 'George A. Romero', 4],
  ['The Exorcist', 1973, 122, ['Horror'], 'William Friedkin', 4.5],
  ['Barbarian', 2022, 103, ['Horror', 'Thriller'], 'Zach Cregger', 3.5],
  ['Smile', 2022, 115, ['Horror', 'Mystery'], 'Parker Finn', 3],
  ['M3GAN', 2022, 102, ['Horror', 'Science Fiction'], 'Gerard Johnstone', 3],
  ['Bodies Bodies Bodies', 2022, 95, ['Horror', 'Comedy'], 'Halina Reijn', 3],
  ['The Holdovers', 2023, 133, ['Comedy', 'Drama'], 'Alexander Payne', 4],
  ['Poor Things', 2023, 141, ['Science Fiction', 'Romance', 'Comedy'], 'Yorgos Lanthimos', 4],
  ['The Favourite', 2018, 120, ['Drama', 'History', 'Comedy'], 'Yorgos Lanthimos', 4],
  ['Superman', 2025, 129, ['Science Fiction', 'Adventure', 'Action'], 'James Gunn', 3],
  ['Mickey 17', 2025, 137, ['Science Fiction', 'Comedy', 'Adventure'], 'Bong Joon Ho', 3.5],
  ['The Phoenician Scheme', 2025, 102, ['Comedy', 'Adventure'], 'Wes Anderson', 3.5],
  ['Ghostbusters', 1984, 105, ['Comedy', 'Fantasy'], 'Ivan Reitman', 3.5],
  ['When Harry Met Sally...', 1989, 96, ['Comedy', 'Romance', 'Drama'], 'Rob Reiner', 4],
  ['Groundhog Day', 1993, 101, ['Romance', 'Fantasy', 'Drama', 'Comedy'], 'Harold Ramis', 4],
  ['Clueless', 1995, 97, ['Comedy', 'Romance'], 'Amy Heckerling', 3.5],
  ['Spider-Man: Across the Spider-Verse', 2023, 140, ['Animation', 'Action', 'Adventure'], 'Joaquim Dos Santos', 4.5],
  ['My Neighbor Totoro', 1988, 86, ['Animation', 'Family', 'Fantasy'], 'Hayao Miyazaki', 4.5],
  ['The Boy and the Heron', 2023, 124, ['Animation', 'Adventure', 'Fantasy'], 'Hayao Miyazaki', 4],
  ['Ratatouille', 2007, 111, ['Animation', 'Comedy', 'Family'], 'Brad Bird', 4.5],
  ['WALL·E', 2008, 98, ['Animation', 'Family', 'Science Fiction'], 'Andrew Stanton', 4.5],
  ['The Wild Robot', 2024, 102, ['Animation', 'Science Fiction', 'Family'], 'Chris Sanders', 4],
  ['Inside Out 2', 2024, 97, ['Animation', 'Family', 'Comedy'], 'Kelsey Mann', 3.5],
]

const TAGS = ['with friends', 'theater', 'solo', 'date night', 'rainy day', 'film club']

/** Small deterministic PRNG (mulberry32) so the demo looks the same on every load. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

function generateDiary() {
  const rand = rng(2025)
  const rows: Record<string, string>[] = []
  const seen = new Set<string>()
  const horror = FILMS.filter((f) => f[3].includes('Horror'))
  let id = 0

  // This viewer joined in mid-2024; the latest entries are from September 2026.
  for (let t = Date.UTC(2024, 5, 1); t <= Date.UTC(2026, 8, 30); t += 86_400_000) {
    const d = new Date(t)
    const month = d.getUTCMonth()
    const weekday = d.getUTCDay()
    const isWeekend = weekday === 0 || weekday === 5 || weekday === 6
    const spookySeason = month === 9
    const forcedStreak = d.getUTCFullYear() === 2025 && month === 9 && d.getUTCDate() >= 20
    const chance = (isWeekend ? 0.32 : 0.12) + (spookySeason ? 0.3 : 0) + (month === 11 ? 0.1 : 0)
    if (!forcedStreak && rand() > chance) continue

    const loveHorror = rand() < (spookySeason ? 0.85 : 0.2)
    const released = (loveHorror ? horror : FILMS).filter((f) => f[1] <= d.getUTCFullYear())
    // Mostly new-to-you films, with the occasional comfort rewatch.
    const unseen = released.filter((f) => !seen.has(`${f[0]}|${f[1]}`))
    const pool = unseen.length && rand() < 0.85 ? unseen : released
    const [name, year, , , , base] = pool[Math.floor(rand() * pool.length)]
    const key = `${name}|${year}`
    const rewatch = seen.has(key)
    seen.add(key)

    const jitter = rand() < 0.3 ? (rand() < 0.5 ? -0.5 : 0.5) : 0
    // Spring is the harsh season for this viewer; December is generous.
    const mood = month >= 2 && month <= 4 ? -0.5 : month === 11 ? 0.5 : 0
    const rating = Math.min(5, Math.max(0.5, base + jitter + mood))
    const tags = new Set<string>()
    if (year === d.getUTCFullYear() && rand() < 0.7) tags.add('theater')
    if (spookySeason) tags.add('spooky season')
    if (rand() < 0.3) tags.add(TAGS[Math.floor(rand() * TAGS.length)])

    const date = iso(d)
    rows.push({
      Date: date,
      Name: name,
      Year: String(year),
      'Letterboxd URI': `https://boxd.it/sample${(id++).toString(36)}`,
      Rating: rand() < 0.08 ? '' : String(rating),
      Rewatch: rewatch ? 'Yes' : '',
      Tags: [...tags].join(', '),
      'Watched Date': date,
    })
  }
  return rows
}

export function sampleExport(): ExportFiles {
  const diary = generateDiary()
  const latest = new Map<string, Record<string, string>>()
  for (const row of diary) latest.set(`${row.Name}|${row.Year}`, row)

  const films = [...latest.values()]
  const pick = (cols: string[], rows: Record<string, string>[]) =>
    Papa.unparse(rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? '']))), { columns: cols })

  const liked = films.filter((r) => Number(r.Rating) >= 4.5)
  return {
    'diary.csv': Papa.unparse(diary),
    'watched.csv': pick(['Date', 'Name', 'Year', 'Letterboxd URI'], films),
    'ratings.csv': pick(['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating'], films.filter((r) => r.Rating)),
    'likes/films.csv': pick(['Date', 'Name', 'Year', 'Letterboxd URI'], liked),
    'reviews.csv': Papa.unparse(
      diary
        .filter((_, i) => i % 7 === 0)
        .map((r) => ({ ...r, Review: 'Thinking about this one for days.' })),
    ),
  }
}

/** Bundled metadata for the sample films (stands in for TMDB in demo mode). */
export function sampleMeta(): MetaLookup {
  const meta: MetaLookup = new Map()
  for (const [name, year, runtime, genres, director] of FILMS) {
    const film: FilmMeta = { runtime, genres, directors: [director], posterUrl: null }
    meta.set(filmKey(name, year), film)
  }
  return meta
}
