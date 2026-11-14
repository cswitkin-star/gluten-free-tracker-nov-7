import { describe, expect, it } from 'vitest'
import { dishes } from '../data/seed/dishes'
import { restaurants } from '../data/seed/restaurants'
import { safety } from '../data/seed/safety'
import { DEFAULT_PROFILE } from '../store/useApp'
import { decodePayload, encodePayload, extractPayload, isInvite, isReply, type InvitePayload, type ReplyPayload } from './share'
import { buildShortlist, type GroupConstraints } from './shortlist'
import { tally } from './tally'

const invite: InvitePayload = {
  v: 1, g: 'g1', t: 'Friday dinner at Café Lumière', n: 6,
  o: [{ id: 'r01', name: 'Maíz y Fuego (Sample)', cuisine: 'Mexican', neighborhood: 'Bushwick', price: 1 }],
}

describe('share links', () => {
  it('round-trips unicode', () => {
    expect(decodePayload<InvitePayload>(encodePayload(invite))).toEqual(invite)
  })
  it('is URL-safe', () => {
    expect(encodePayload(invite)).toMatch(/^[A-Za-z0-9_-]+$/)
  })
  it('returns null for garbage', () => {
    expect(decodePayload('%%%not-base64')).toBeNull()
    expect(isInvite(decodePayload(encodePayload({ v: 1, g: 'x', who: 'A', votes: {} })))).toBe(false)
  })
  it('validates replies', () => {
    const reply: ReplyPayload = { v: 1, g: 'g1', who: 'Sam', votes: { r01: 'yes' } }
    expect(isReply(decodePayload(encodePayload(reply)))).toBe(true)
    expect(isReply({ v: 1, g: 'g1', who: 'Sam', votes: { r01: 'definitely' } })).toBe(false)
  })
  it('extracts a payload from a pasted link', () => {
    const p = encodePayload(invite)
    expect(extractPayload(`https://example.com/app/#/vote/${p}`)).toBe(p)
    expect(extractPayload(`  ${p}  `)).toBe(p)
  })
  it('never carries diet information', () => {
    const json = JSON.stringify(invite).toLowerCase()
    for (const w of ['celiac', 'gluten', 'gf', 'tolerance', 'sensitive']) expect(json).not.toContain(w)
  })
})

describe('tally', () => {
  const opts = [
    { id: 'a', name: 'A', cuisine: '', neighborhood: '', price: 1 },
    { id: 'b', name: 'B', cuisine: '', neighborhood: '', price: 1 },
  ]
  it('has no leader before any votes', () => {
    expect(tally(opts, {}).some((r) => r.leading)).toBe(false)
  })
  it('scores yes=2, maybe=1, no=0 and picks the leader', () => {
    const rows = tally(opts, { Sam: { a: 'yes', b: 'no' }, Jo: { a: 'maybe', b: 'yes' }, Lee: { a: 'yes', b: 'maybe' } })
    expect(rows[0]).toMatchObject({ yes: 2, maybe: 1, no: 0, score: 5, leading: true })
    expect(rows[1]).toMatchObject({ score: 3, leading: false })
  })
  it('breaks ties with fewer no votes', () => {
    const rows = tally(opts, { Sam: { a: 'yes', b: 'maybe' }, Jo: { a: 'no', b: 'maybe' } })
    expect(rows.find((r) => r.option.id === 'b')?.leading).toBe(true)
  })
})

describe('buildShortlist', () => {
  const candidates = restaurants.map((restaurant) => ({
    restaurant,
    safety: safety.find((s) => s.restaurantId === restaurant.id)!,
    dishes: dishes.filter((d) => d.restaurantId === restaurant.id),
  }))
  const base: GroupConstraints = { size: 4, cuisines: [], maxPrice: 4, neighborhood: '', openNow: false, tolerance: 'celiac' }
  const run = (c: Partial<GroupConstraints>, limit = 20) =>
    buildShortlist(candidates, DEFAULT_PROFILE, { ...base, ...c }, { today: '2026-11-13', hour: 19, limit })

  it('never includes a Skip for the GF eater', () => {
    expect(run({}).every((i) => i.match.label !== 'skip')).toBe(true)
    expect(run({}).some((i) => i.restaurant.id === 'r04')).toBe(false) // shared kitchen, unaware staff
  })
  it('respects price, cuisine and neighborhood', () => {
    expect(run({ maxPrice: 2 }).every((i) => i.restaurant.price <= 2)).toBe(true)
    expect(run({ cuisines: ['Pizza'] }).map((i) => i.restaurant.id)).toEqual(['r01'])
    expect(run({ neighborhood: 'Chelsea' }).map((i) => i.restaurant.id)).toEqual(['r15'])
  })
  it('puts great matches before workable ones', () => {
    const labels = run({}).map((i) => i.match.label)
    expect(labels.indexOf('workable') === -1 || labels.lastIndexOf('great') < labels.indexOf('workable')).toBe(true)
  })
  it('is stricter for celiac than for preference', () => {
    expect(run({ tolerance: 'preference' }).length).toBeGreaterThan(run({ tolerance: 'celiac' }).length)
  })
  it('respects open now', () => {
    expect(run({ openNow: true }).some((i) => i.restaurant.id === 'r08')).toBe(false) // closes at 5pm
  })
})
