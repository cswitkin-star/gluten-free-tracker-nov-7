import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { catalogRepo } from '../data'
import type { Catalog, Dish, Restaurant, RestaurantSafety, Review } from '../types'
import { useApp } from './useApp'

// One shared in-flight request, so several components asking at once only hit the backend once.
let inflight: Promise<void> | null = null

const useCatalogStore = create<{ catalog: Catalog | null; load: () => Promise<void> }>((set, get) => ({
  catalog: null,
  load: () => {
    if (get().catalog) return Promise.resolve()
    inflight ??= catalogRepo
      .load()
      .then((catalog) => set({ catalog }))
      .finally(() => {
        inflight = null
      })
    return inflight
  },
}))

const UNKNOWN_SAFETY = (restaurantId: string): RestaurantSafety => ({
  restaurantId,
  fryer: 'unknown',
  kitchen: 'unknown',
  staffKnowledge: 'unknown',
  flaggedGfFood: false,
  lastConfirmed: null,
})

export interface MergedData {
  restaurants: Restaurant[]
  getRestaurant: (id: string) => Restaurant | undefined
  getSafety: (id: string) => RestaurantSafety
  getDishes: (id: string) => Dish[]
  getReviews: (id: string) => Review[]
}

/** Catalog (seed or hosted) merged with the user's local edits. */
export function useData(): { ready: boolean; data: MergedData } {
  const catalog = useCatalogStore((s) => s.catalog)
  const load = useCatalogStore((s) => s.load)
  const userDishes = useApp((s) => s.userDishes)
  const safetyOverrides = useApp((s) => s.safetyOverrides)
  const userReviews = useApp((s) => s.userReviews)

  useEffect(() => {
    void load()
  }, [load])

  const data = useMemo<MergedData>(() => {
    const restaurants = catalog?.restaurants ?? []
    const byId = new Map(restaurants.map((r) => [r.id, r]))
    const safetyMap = new Map<string, RestaurantSafety>(
      (catalog?.safety ?? []).map((s) => [s.restaurantId, { ...s, ...safetyOverrides[s.restaurantId] }]),
    )
    for (const [id, o] of Object.entries(safetyOverrides)) {
      if (!safetyMap.has(id)) safetyMap.set(id, { ...UNKNOWN_SAFETY(id), ...o })
    }
    const dishMap = new Map<string, Dish>((catalog?.dishes ?? []).map((d) => [d.id, d]))
    for (const d of userDishes) dishMap.set(d.id, d)
    const dishesByR = new Map<string, Dish[]>()
    for (const d of dishMap.values()) dishesByR.set(d.restaurantId, [...(dishesByR.get(d.restaurantId) ?? []), d])
    const allReviews = [...userReviews, ...(catalog?.reviews ?? [])]
    const reviewsByR = new Map<string, Review[]>()
    for (const r of allReviews) reviewsByR.set(r.restaurantId, [...(reviewsByR.get(r.restaurantId) ?? []), r])

    return {
      restaurants,
      getRestaurant: (id) => byId.get(id),
      getSafety: (id) => safetyMap.get(id) ?? UNKNOWN_SAFETY(id),
      getDishes: (id) => dishesByR.get(id) ?? [],
      getReviews: (id) => reviewsByR.get(id) ?? [],
    }
  }, [catalog, userDishes, safetyOverrides, userReviews])

  return { ready: catalog !== null, data }
}
