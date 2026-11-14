import type { SupabaseClient } from '@supabase/supabase-js'
import type { Allergen, Catalog, Dish, Price, Restaurant, RestaurantSafety, Review } from '../types'
import type { CatalogRepo } from './catalog'

// Row shapes as Postgres returns them (snake_case). Kept loose on purpose:
// we validate by mapping, and the CHECK constraints in SQL guard the values.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

export const mapRestaurant = (r: Row): Restaurant => ({
  id: r.id,
  googlePlaceId: r.google_place_id,
  name: r.name,
  neighborhood: r.neighborhood,
  address: r.address,
  lat: Number(r.lat),
  lng: Number(r.lng),
  cuisine: r.cuisine,
  price: Number(r.price) as Price,
  hours: { open: Number(r.hours_open), close: Number(r.hours_close) },
  blurb: r.blurb ?? '',
  hasGfBeer: !!r.has_gf_beer,
  hasGfDesserts: !!r.has_gf_desserts,
  sample: !!r.sample,
})

export const mapSafety = (r: Row): RestaurantSafety => ({
  restaurantId: r.restaurant_id,
  fryer: r.fryer,
  kitchen: r.kitchen,
  staffKnowledge: r.staff_knowledge,
  flaggedGfFood: !!r.flagged_gf_food,
  lastConfirmed: r.last_confirmed ?? null,
})

export const mapDish = (r: Row): Dish => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  name: r.name,
  gfStatus: r.gf_status,
  modificationNote: r.modification_note ?? '',
  fried: !!r.fried,
  allergens: (r.allergens ?? []) as Allergen[],
  lastConfirmed: r.last_confirmed,
  source: r.source,
})

export const mapReview = (r: Row): Review => ({
  id: r.id,
  restaurantId: r.restaurant_id,
  author: r.author,
  reviewerTolerance: r.reviewer_tolerance,
  safetyRating: r.safety_rating ?? null,
  tasteRating: r.taste_rating,
  text: r.text ?? '',
  date: r.date,
  sample: !!r.sample,
})

/** Reads the catalog from Supabase. Throws on any API error so the caller can fall back. */
export function createSupabaseCatalogRepo(client: SupabaseClient): CatalogRepo {
  return {
    async load(): Promise<Catalog> {
      const [restaurants, safety, dishes, reviews] = await Promise.all([
        client.from('restaurants').select('*').order('id'),
        client.from('restaurant_safety').select('*'),
        client.from('dishes').select('*').order('id'),
        client.from('reviews').select('*').order('date', { ascending: false }),
      ])
      for (const res of [restaurants, safety, dishes, reviews]) if (res.error) throw res.error
      if (!restaurants.data?.length) throw new Error('Supabase returned no restaurants')
      return {
        restaurants: restaurants.data.map(mapRestaurant),
        safety: (safety.data ?? []).map(mapSafety),
        dishes: (dishes.data ?? []).map(mapDish),
        reviews: (reviews.data ?? []).map(mapReview),
      }
    },
  }
}
