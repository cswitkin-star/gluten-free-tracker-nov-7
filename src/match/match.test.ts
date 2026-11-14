import { describe, expect, it } from 'vitest'
import { BANNED_PHRASES } from '../copy'
import { dishes as seedDishes } from '../data/seed/dishes'
import { restaurants } from '../data/seed/restaurants'
import { safety as seedSafety } from '../data/seed/safety'
import { DEFAULT_PROFILE } from '../store/useApp'
import type { Dish, Profile, Restaurant, RestaurantSafety } from '../types'
import { computeMatch } from './match'

const TODAY = '2026-11-13'

const restaurant: Restaurant = {
  id: 'x', googlePlaceId: 'sample_x', name: 'Test Place (Sample)', neighborhood: 'Soho', address: '', lat: 0, lng: 0,
  cuisine: 'Test', price: 2, hours: { open: 11, close: 22 }, blurb: '', hasGfBeer: false, hasGfDesserts: false, sample: true,
}
const safe = (o: Partial<RestaurantSafety> = {}): RestaurantSafety => ({
  restaurantId: 'x', fryer: 'unknown', kitchen: 'unknown', staffKnowledge: 'unknown', flaggedGfFood: false,
  lastConfirmed: '2026-11-01', ...o,
})
const dish = (o: Partial<Dish> = {}): Dish => ({
  id: Math.random().toString(36), restaurantId: 'x', name: 'Test dish', gfStatus: 'gf_as_served', modificationNote: '',
  fried: false, allergens: [], lastConfirmed: '2026-11-01', source: 'seed', ...o,
})
const profile = (o: Partial<Profile> = {}): Profile => ({ ...DEFAULT_PROFILE, onboarded: true, ...o })
const run = (p: Partial<Profile>, s: Partial<RestaurantSafety>, d: Dish[], r = restaurant) =>
  computeMatch({ profile: profile(p), restaurant: r, safety: safe(s), dishes: d, today: TODAY })

describe('same restaurant, different tolerance', () => {
  // Shared kitchen and fryer, staff somewhat familiar, a couple of GF dishes.
  const s: Partial<RestaurantSafety> = { fryer: 'shared', kitchen: 'shared', staffKnowledge: 'some', flaggedGfFood: true }
  const d = [dish({ name: 'Grilled fish' }), dish({ name: 'Salad' }), dish({ name: 'Fries', fried: true, gfStatus: 'can_be_gf' })]

  it('celiac gets a cautious answer with things to ask', () => {
    const m = run({ tolerance: 'celiac' }, s, d)
    expect(m.label).toBe('workable')
    expect(m.ask.length).toBeGreaterThan(0)
    expect(m.reason.toLowerCase()).toContain('ask about')
  })
  it('sensitive is fine with it (shared fryer tolerated, staff familiar)', () => {
    expect(run({ tolerance: 'sensitive' }, { ...s, kitchen: 'separate_prep' }, d).label).toBe('great')
  })
  it('preference only cares that there is good GF food', () => {
    expect(run({ tolerance: 'preference' }, s, d).label).toBe('great')
  })
})

describe('celiac / strict', () => {
  it('says great for a reported dedicated GF kitchen with fresh confirmation', () => {
    const m = run({ tolerance: 'celiac' }, { fryer: 'dedicated', kitchen: 'dedicated_gf', staffKnowledge: 'knowledgeable' }, [dish()])
    expect(m.label).toBe('great')
    expect(m.reason).toContain('Reported')
  })
  it('does not say great when the facts are stale, and says so', () => {
    const m = run({ tolerance: 'celiac' }, { fryer: 'dedicated', kitchen: 'dedicated_gf', lastConfirmed: '2025-01-01' }, [dish()])
    expect(m.label).not.toBe('great')
    expect(m.lowConfidence).toBe(true)
    expect(m.ask.join(' ')).toContain('last confirmed')
  })
  it('skips when the only GF options are fried in a shared fryer', () => {
    const m = run({ tolerance: 'celiac' }, { fryer: 'shared', kitchen: 'separate_prep', staffKnowledge: 'some' }, [dish({ fried: true })])
    expect(m.label).toBe('skip')
    expect(m.reason).toContain('fryer')
  })
  it('skips a shared kitchen with unfamiliar staff', () => {
    expect(run({ tolerance: 'celiac' }, { kitchen: 'shared', staffKnowledge: 'unaware' }, [dish()]).label).toBe('skip')
  })
  it('does not assume unknown means fine', () => {
    const m = run({ tolerance: 'celiac' }, { lastConfirmed: null }, [])
    expect(m.label).toBe('skip')
    expect(m.lowConfidence).toBe(true)
  })
  it('respects the dedicated-fryer toggle as a must-have', () => {
    const s = { fryer: 'shared' as const, kitchen: 'separate_prep' as const, staffKnowledge: 'knowledgeable' as const }
    expect(run({ tolerance: 'celiac', needsDedicatedFryer: true }, s, [dish()]).label).toBe('skip')
    expect(run({ tolerance: 'celiac', needsDedicatedFryer: false }, s, [dish()]).label).toBe('workable')
  })
  it('respects the separate-prep toggle', () => {
    expect(run({ tolerance: 'celiac', needsSeparatePrep: true }, { kitchen: 'shared', staffKnowledge: 'some' }, [dish()]).label).toBe('skip')
  })
})

describe('sensitive', () => {
  it('tolerates a shared fryer when other signals are good', () => {
    const m = run({ tolerance: 'sensitive' }, { fryer: 'shared', kitchen: 'separate_prep', staffKnowledge: 'knowledgeable' }, [dish()])
    expect(m.label).toBe('great')
  })
  it('is workable, not skip, when info is thin', () => {
    expect(run({ tolerance: 'sensitive' }, { lastConfirmed: null }, []).label).toBe('workable')
  })
})

describe('preference', () => {
  it('rarely skips: thin data is workable', () => {
    expect(run({ tolerance: 'preference' }, { lastConfirmed: null }, []).label).toBe('workable')
  })
  it('does not penalize a shared kitchen', () => {
    const d = [dish(), dish({ name: 'Second' })]
    expect(run({ tolerance: 'preference' }, { fryer: 'shared', kitchen: 'shared', staffKnowledge: 'unaware' }, d).label).toBe('great')
  })
  it('mentions GF beer when the user wants it and the place has it', () => {
    const m = run({ tolerance: 'preference', wantsGfBeer: true }, {}, [dish(), dish()], { ...restaurant, hasGfBeer: true })
    expect(m.reason).toContain('GF beer')
  })
  it('only has modifiable dishes: workable and tells you what to ask', () => {
    const m = run({ tolerance: 'preference' }, {}, [dish({ gfStatus: 'can_be_gf', name: 'Pad thai', modificationNote: 'no soy sauce' })])
    expect(m.label).toBe('workable')
    expect(m.reason).toContain('no soy sauce')
  })
})

describe('every level', () => {
  it('skips if no dish is gluten-free', () => {
    for (const tolerance of ['celiac', 'sensitive', 'preference'] as const) {
      expect(run({ tolerance }, { kitchen: 'dedicated_gf' }, [dish({ gfStatus: 'not_gf' })]).label).toBe('skip')
    }
  })
  it('skips when allergies remove every GF dish', () => {
    const m = run({ tolerance: 'preference', allergies: ['nuts'] }, {}, [dish({ allergens: ['nuts'] })])
    expect(m.label).toBe('skip')
    expect(m.reason).toContain('nuts')
  })
  it('keeps dishes without the allergen', () => {
    const m = run({ tolerance: 'preference', allergies: ['nuts'] }, {}, [dish({ allergens: ['nuts'] }), dish(), dish()])
    expect(m.label).toBe('great')
  })
})

describe('with the seed data', () => {
  const matchFor = (id: string, p: Partial<Profile>) => {
    const r = restaurants.find((x) => x.id === id)!
    return computeMatch({
      profile: profile(p), restaurant: r, safety: seedSafety.find((s) => s.restaurantId === id)!,
      dishes: seedDishes.filter((d) => d.restaurantId === id), today: TODAY,
    })
  }
  it('dedicated GF pizzeria is great for celiac', () => expect(matchFor('r01', { tolerance: 'celiac' }).label).toBe('great'))
  it('noodle house with shared kitchen and unaware staff is a skip for celiac but workable for preference', () => {
    expect(matchFor('r04', { tolerance: 'celiac' }).label).toBe('skip')
    expect(matchFor('r04', { tolerance: 'preference' }).label).toBe('workable')
  })
  it('burger place with shared fryer: workable for celiac, great for preference', () => {
    expect(matchFor('r06', { tolerance: 'celiac' }).label).toBe('workable')
    expect(matchFor('r06', { tolerance: 'preference' }).label).toBe('great')
  })
  it('low-data restaurant is a skip for celiac (not enough info) but not for preference', () => {
    expect(matchFor('r20', { tolerance: 'celiac' }).label).toBe('skip')
    expect(matchFor('r20', { tolerance: 'preference' }).label).toBe('workable')
  })
  it('never produces overpromising wording across all restaurants and levels', () => {
    for (const r of restaurants) {
      for (const tolerance of ['celiac', 'sensitive', 'preference'] as const) {
        const m = matchFor(r.id, { tolerance })
        const text = (m.reason + ' ' + m.ask.join(' ')).toLowerCase()
        for (const b of BANNED_PHRASES) expect(text).not.toContain(b)
        expect(text).not.toMatch(/\bsafe\b/)
      }
    }
  })
})
