import { describe, expect, it } from 'vitest'
import { BANNED_PHRASES } from '.'
import { DEFAULT_PROFILE } from '../store/useApp'
import type { Dish, Profile } from '../types'
import { orderCardContent } from './orderCard'

const p = (o: Partial<Profile>): Profile => ({ ...DEFAULT_PROFILE, ...o })
const text = (c: ReturnType<typeof orderCardContent>) => [c.heading, ...c.lines, ...c.notes, c.thanks].join(' ')

describe('order card', () => {
  it('celiac asks for a clean surface and no shared fryer', () => {
    const t = text(orderCardContent(p({ tolerance: 'celiac' })))
    expect(t).toContain('celiac')
    expect(t).toContain('clean surface')
    expect(t).toContain('shared fryer')
  })
  it('is different for each tolerance level', () => {
    const [a, b, c] = (['celiac', 'sensitive', 'preference'] as const).map((tolerance) => text(orderCardContent(p({ tolerance }))))
    expect(new Set([a, b, c]).size).toBe(3)
  })
  it('preference version is relaxed and does not mention celiac', () => {
    const t = text(orderCardContent(p({ tolerance: 'preference' })))
    expect(t.toLowerCase()).not.toContain('celiac')
    expect(t).not.toContain('fryer')
  })
  it('includes toggles and allergies', () => {
    const t = text(orderCardContent(p({ tolerance: 'celiac', needsDedicatedFryer: true, needsSeparatePrep: true, allergies: ['nuts', 'dairy'] })))
    expect(t).toContain('dedicated fryer')
    expect(t).toContain('separate prep')
    expect(t).toContain('nuts, dairy')
  })
  it('adds restaurant-specific notes from dish modifications', () => {
    const dish: Dish = { id: 'd', restaurantId: 'x', name: 'Pad thai', gfStatus: 'can_be_gf', modificationNote: 'no soy sauce', fried: false, allergens: [], lastConfirmed: '2026-11-01', source: 'seed' }
    expect(orderCardContent(p({}), [dish]).notes).toEqual(['Pad thai: no soy sauce'])
  })
  it('never overpromises', () => {
    for (const tolerance of ['celiac', 'sensitive', 'preference'] as const) {
      const t = text(orderCardContent(p({ tolerance }))).toLowerCase()
      for (const b of BANNED_PHRASES) expect(t).not.toContain(b)
    }
  })
})
