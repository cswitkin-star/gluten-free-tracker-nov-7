import { isOpenAt, nycHourNow } from '../lib/dates'
import { computeMatch, LABEL_RANK } from '../match/match'
import type { Dish, MatchResult, Price, Profile, Restaurant, RestaurantSafety, Tolerance } from '../types'

export interface GroupConstraints {
  size: number
  /** Empty means any cuisine. */
  cuisines: string[]
  maxPrice: Price
  /** Empty means anywhere. */
  neighborhood: string
  openNow: boolean
  /** Tolerance of the gluten-free eater in the group. */
  tolerance: Tolerance
}

export interface Candidate {
  restaurant: Restaurant
  safety: RestaurantSafety
  dishes: Dish[]
}

export interface ShortlistItem {
  restaurant: Restaurant
  match: MatchResult
}

/**
 * Builds a shortlist that works for the group and for the GF eater.
 * Anything the match engine says to skip is dropped, then great beats workable.
 * Group size is not used to filter (we have no capacity data); callers should
 * advise calling ahead for big parties.
 */
export function buildShortlist(
  candidates: Candidate[],
  profile: Profile,
  c: GroupConstraints,
  opts: { limit?: number; today?: string; hour?: number } = {},
): ShortlistItem[] {
  const { limit = 5, today, hour = nycHourNow() } = opts
  const groupProfile: Profile = { ...profile, tolerance: c.tolerance }

  return candidates
    .filter(({ restaurant: r }) => {
      if (r.price > c.maxPrice) return false
      if (c.cuisines.length && !c.cuisines.includes(r.cuisine)) return false
      if (c.neighborhood && r.neighborhood !== c.neighborhood) return false
      if (c.openNow && !isOpenAt(r.hours, hour)) return false
      return true
    })
    .map(({ restaurant, safety, dishes }) => ({
      restaurant,
      match: computeMatch({ profile: groupProfile, restaurant, safety, dishes, today }),
      asServed: dishes.filter((d) => d.gfStatus === 'gf_as_served').length,
    }))
    .filter((x) => x.match.label !== 'skip')
    .sort(
      (a, b) =>
        LABEL_RANK[a.match.label] - LABEL_RANK[b.match.label] ||
        Number(a.match.lowConfidence) - Number(b.match.lowConfidence) ||
        b.asServed - a.asServed ||
        a.restaurant.name.localeCompare(b.restaurant.name),
    )
    .slice(0, limit)
    .map(({ restaurant, match }) => ({ restaurant, match }))
}
