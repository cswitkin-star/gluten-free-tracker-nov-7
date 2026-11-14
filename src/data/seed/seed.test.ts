import { describe, expect, it } from 'vitest'
import * as copy from '../../copy'
import { dishes } from './dishes'
import { restaurants } from './restaurants'
import { reviews } from './reviews'
import { safety } from './safety'

describe('seed data', () => {
  const ids = new Set(restaurants.map((r) => r.id))

  it('has about 20 restaurants, all marked as sample data', () => {
    expect(restaurants).toHaveLength(20)
    expect(restaurants.every((r) => r.sample && r.googlePlaceId.startsWith('sample_'))).toBe(true)
    expect(restaurants.every((r) => r.name.includes('(Sample)'))).toBe(true)
  })

  it('has one safety row per restaurant and no dangling references', () => {
    expect(safety.map((s) => s.restaurantId).sort()).toEqual([...ids].sort())
    expect(dishes.every((d) => ids.has(d.restaurantId))).toBe(true)
    expect(reviews.every((r) => ids.has(r.restaurantId))).toBe(true)
  })

  it('has unique dish ids', () => {
    expect(new Set(dishes.map((d) => d.id)).size).toBe(dishes.length)
  })

  it('never uses overpromising safety wording', () => {
    const text = [
      ...dishes.map((d) => d.name + ' ' + d.modificationNote),
      ...reviews.map((r) => r.text),
      ...restaurants.map((r) => r.blurb),
      copy.DISCLAIMER_SHORT,
      copy.DISCLAIMER_LONG,
      copy.SAMPLE_DATA_NOTICE,
    ]
      .join('\n')
      .toLowerCase()
    for (const phrase of copy.BANNED_PHRASES) expect(text).not.toContain(phrase)
  })
})
