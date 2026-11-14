import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../store/useApp'
import type { Dish, Visit } from '../types'
import { isUserData, mergeUserData, type UserData } from './userData'

const empty = (o: Partial<UserData> = {}): UserData => ({
  v: 1, profile: DEFAULT_PROFILE, saved: [], visits: [], userDishes: [], safetyOverrides: {}, userReviews: [], groups: [], ...o,
})
const visit = (id: string, date = '2026-11-01'): Visit => ({ id, restaurantId: 'r01', dishesOrdered: [], outcome: 'fine', date, notes: '' })
const dish = (id: string, lastConfirmed: string, name = 'D'): Dish => ({
  id, restaurantId: 'r01', name, gfStatus: 'can_be_gf', modificationNote: '', fried: false, allergens: [], lastConfirmed, source: 'user',
})

describe('mergeUserData', () => {
  it('uploads local data when the account has none', () => {
    const local = empty({ saved: ['r01'] })
    expect(mergeUserData(local, null)).toBe(local)
  })
  it('keeps both sides of saved places and visits, without duplicates', () => {
    const m = mergeUserData(
      empty({ saved: ['r01', 'r02'], visits: [visit('a'), visit('b', '2026-11-05')] }),
      empty({ saved: ['r02', 'r03'], visits: [visit('b', '2026-11-05'), visit('c', '2026-10-01')] }),
    )
    expect(m.saved.sort()).toEqual(['r01', 'r02', 'r03'])
    expect(m.visits.map((v) => v.id)).toEqual(['b', 'a', 'c']) // newest first
  })
  it('prefers the account profile when it is finished, else this device', () => {
    const done = { ...DEFAULT_PROFILE, onboarded: true, tolerance: 'sensitive' as const }
    const here = { ...DEFAULT_PROFILE, onboarded: true, tolerance: 'preference' as const }
    expect(mergeUserData(empty({ profile: here }), empty({ profile: done })).profile.tolerance).toBe('sensitive')
    expect(mergeUserData(empty({ profile: here }), empty()).profile.tolerance).toBe('preference')
    expect(mergeUserData(empty({ profile: here }), empty({ profile: DEFAULT_PROFILE })).profile.tolerance).toBe('preference')
  })
  it('keeps the more recently confirmed version of a dish edit', () => {
    const m = mergeUserData(empty({ userDishes: [dish('x', '2026-11-10', 'new')] }), empty({ userDishes: [dish('x', '2026-10-01', 'old')] }))
    expect(m.userDishes).toHaveLength(1)
    expect(m.userDishes[0].name).toBe('new')
  })
  it('keeps the newer safety confirmation per restaurant', () => {
    const m = mergeUserData(
      empty({ safetyOverrides: { r01: { fryer: 'dedicated', lastConfirmed: '2026-11-12' } } }),
      empty({ safetyOverrides: { r01: { fryer: 'shared', lastConfirmed: '2026-10-01' }, r02: { fryer: 'shared', lastConfirmed: '2026-10-01' } } }),
    )
    expect(m.safetyOverrides.r01.fryer).toBe('dedicated')
    expect(m.safetyOverrides.r02.fryer).toBe('shared')
  })
  it('merges group votes from both sides', () => {
    const g = (votes: Record<string, Record<string, 'yes' | 'no'>>) => ({ id: 'g1', title: 't', size: 2, createdAt: '2026-11-01', options: [], votes })
    const m = mergeUserData(empty({ groups: [g({ Sam: { r01: 'yes' } })] }), empty({ groups: [g({ Jo: { r01: 'no' } })] }))
    expect(Object.keys(m.groups[0].votes).sort()).toEqual(['Jo', 'Sam'])
  })
})

describe('isUserData', () => {
  it('accepts a valid document and rejects junk', () => {
    expect(isUserData(empty())).toBe(true)
    expect(isUserData({})).toBe(false)
    expect(isUserData(null)).toBe(false)
    expect(isUserData({ ...empty(), v: 2 })).toBe(false)
    expect(isUserData({ ...empty(), visits: 'nope' })).toBe(false)
  })
})
