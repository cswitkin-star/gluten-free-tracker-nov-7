import { describe, expect, it } from 'vitest'
import type { FryerStatus, RestaurantSafety, Visit } from '../types'
import { patternHints } from './patterns'

const safety = (id: string, fryer: FryerStatus, o: Partial<RestaurantSafety> = {}): RestaurantSafety => ({
  restaurantId: id, fryer, kitchen: 'separate_prep', staffKnowledge: 'knowledgeable', flaggedGfFood: true, lastConfirmed: '2026-11-01', ...o,
})
const visit = (id: string, restaurantId: string, outcome: Visit['outcome']): Visit => ({
  id, restaurantId, outcome, dishesOrdered: [], date: '2026-11-01', notes: '',
})
const lookup = (rows: RestaurantSafety[]) => ({
  getSafety: (id: string) => rows.find((r) => r.restaurantId === id)!,
  getDishes: () => [],
})

describe('patternHints', () => {
  const rows = [safety('a', 'shared'), safety('b', 'shared'), safety('c', 'dedicated'), safety('d', 'no_fryer')]

  it('flags 2+ reactions at shared-fryer places', () => {
    const hints = patternHints([visit('1', 'a', 'mild'), visit('2', 'b', 'glutened')], lookup(rows))
    expect(hints.map((h) => h.text)).toContain('2 reactions at places reported to have shared fryers.')
  })
  it('stays quiet with a single reaction', () => {
    expect(patternHints([visit('1', 'a', 'mild')], lookup(rows))).toEqual([])
  })
  it('does not count fine visits as reactions', () => {
    expect(patternHints([visit('1', 'a', 'fine'), visit('2', 'b', 'fine')], lookup(rows))).toEqual([])
  })
  it('notes a positive pattern when most fine visits had no shared fryer', () => {
    const v = [visit('1', 'c', 'fine'), visit('2', 'd', 'fine'), visit('3', 'c', 'fine'), visit('4', 'a', 'fine')]
    const hints = patternHints(v, lookup(rows))
    expect(hints.some((h) => h.tone === 'positive')).toBe(true)
  })
  it('flags unfamiliar staff when reactions cluster there', () => {
    const r = [safety('x', 'no_fryer', { staffKnowledge: 'unaware' }), safety('y', 'no_fryer', { staffKnowledge: 'unknown' })]
    const hints = patternHints([visit('1', 'x', 'mild'), visit('2', 'y', 'mild')], lookup(r))
    expect(hints.some((h) => h.id === 'staff')).toBe(true)
  })
})
