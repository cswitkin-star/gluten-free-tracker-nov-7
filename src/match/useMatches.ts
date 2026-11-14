import { useMemo } from 'react'
import { useApp } from '../store/useApp'
import { useData } from '../store/useCatalog'
import type { MatchResult, Restaurant } from '../types'
import { computeMatch } from './match'

export interface Matched {
  restaurant: Restaurant
  match: MatchResult
}

/** Match results for every restaurant, recomputed when the profile or data changes. */
export function useMatches(): { ready: boolean; items: Matched[] } {
  const { ready, data } = useData()
  const profile = useApp((s) => s.profile)
  const items = useMemo(
    () =>
      data.restaurants.map((restaurant) => ({
        restaurant,
        match: computeMatch({
          profile,
          restaurant,
          safety: data.getSafety(restaurant.id),
          dishes: data.getDishes(restaurant.id),
        }),
      })),
    [data, profile],
  )
  return { ready, items }
}
