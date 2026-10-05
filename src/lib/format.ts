import { MONTHS } from './stats'
import type { Period } from './types'

export function formatHours(minutes: number): string {
  const hours = minutes / 60
  return hours >= 100 ? Math.round(hours).toLocaleString('en-US') : hours.toFixed(1).replace(/\.0$/, '')
}

export function formatStars(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '')
}

export function formatShortDate(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1].slice(0, 3)} ${Number(date.slice(8, 10))}`
}

export function periodLabel(period: Period): string {
  return period === 'all' ? 'All time' : String(period)
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : pluralWord}`
}
