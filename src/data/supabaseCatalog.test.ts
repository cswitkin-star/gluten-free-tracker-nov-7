import { describe, expect, it } from 'vitest'
import { mapDish, mapRestaurant, mapReview, mapSafety } from './supabaseCatalog'

describe('Supabase row mapping', () => {
  it('maps a restaurant, turning numeric strings into numbers', () => {
    const r = mapRestaurant({
      id: 'r02', google_place_id: 'sample_place_02', name: 'X', neighborhood: 'Bushwick', address: 'a',
      lat: 40.7048, lng: -73.9226, cuisine: 'Mexican', price: 1, hours_open: '11.0', hours_close: '26.0',
      blurb: 'b', has_gf_beer: false, has_gf_desserts: true, sample: true,
    })
    expect(r.hours).toEqual({ open: 11, close: 26 })
    expect(r.price).toBe(1)
    expect(r.hasGfDesserts).toBe(true)
    expect(r.googlePlaceId).toBe('sample_place_02')
  })
  it('maps safety with a null last_confirmed', () => {
    expect(mapSafety({ restaurant_id: 'r20', fryer: 'unknown', kitchen: 'unknown', staff_knowledge: 'unknown', flagged_gf_food: false, last_confirmed: null }))
      .toEqual({ restaurantId: 'r20', fryer: 'unknown', kitchen: 'unknown', staffKnowledge: 'unknown', flaggedGfFood: false, lastConfirmed: null })
  })
  it('maps a dish with allergens', () => {
    const d = mapDish({ id: 'r14_d1', restaurant_id: 'r14', name: 'Pad thai', gf_status: 'can_be_gf', modification_note: 'n', fried: false, allergens: ['soy', 'nuts'], last_confirmed: '2026-10-01', source: 'seed' })
    expect(d).toMatchObject({ restaurantId: 'r14', gfStatus: 'can_be_gf', allergens: ['soy', 'nuts'], lastConfirmed: '2026-10-01' })
  })
  it('maps a review with no safety rating', () => {
    const r = mapReview({ id: 'x', restaurant_id: 'r01', author: 'Jo', reviewer_tolerance: 'preference', safety_rating: null, taste_rating: 5, text: 't', date: '2026-09-30', sample: true })
    expect(r.safetyRating).toBeNull()
    expect(r.reviewerTolerance).toBe('preference')
  })
})
