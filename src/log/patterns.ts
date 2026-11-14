import type { Dish, RestaurantSafety, Visit } from '../types'

export interface Hint {
  id: string
  tone: 'caution' | 'positive'
  text: string
}

interface Lookup {
  getSafety: (restaurantId: string) => RestaurantSafety
  getDishes: (restaurantId: string) => Dish[]
}

/**
 * Simple, honest pattern hints from the user's own log. These are observations
 * about their data, never medical conclusions, and they need at least two
 * reactions before they speak up.
 */
export function patternHints(visits: Visit[], lookup: Lookup): Hint[] {
  const hints: Hint[] = []
  const reactions = visits.filter((v) => v.outcome !== 'fine')
  const fines = visits.filter((v) => v.outcome === 'fine')

  const count = (list: Visit[], test: (s: RestaurantSafety) => boolean) =>
    list.filter((v) => test(lookup.getSafety(v.restaurantId))).length

  const sharedFryer = count(reactions, (s) => s.fryer === 'shared')
  if (sharedFryer >= 2) {
    hints.push({ id: 'fryer', tone: 'caution', text: `${sharedFryer} reactions at places reported to have shared fryers.` })
  }
  const sharedKitchen = count(reactions, (s) => s.kitchen === 'shared')
  if (sharedKitchen >= 2) {
    hints.push({ id: 'kitchen', tone: 'caution', text: `${sharedKitchen} reactions at places reported to have shared kitchens.` })
  }
  const unfamiliar = count(reactions, (s) => s.staffKnowledge === 'unaware' || s.staffKnowledge === 'unknown')
  if (unfamiliar >= 2) {
    hints.push({ id: 'staff', tone: 'caution', text: `${unfamiliar} reactions at places where staff were not reported as familiar with gluten-free needs.` })
  }

  // Dishes you ordered that were tagged "can be made GF" before a reaction.
  const modified = reactions.filter((v) =>
    lookup.getDishes(v.restaurantId).some((d) => v.dishesOrdered.includes(d.name) && d.gfStatus === 'can_be_gf'),
  ).length
  if (modified >= 2) {
    hints.push({ id: 'modified', tone: 'caution', text: `${modified} reactions after ordering dishes that needed changes to be gluten-free.` })
  }

  if (fines.length >= 3) {
    const clean = count(fines, (s) => s.fryer === 'dedicated' || s.fryer === 'no_fryer')
    if (clean / fines.length >= 0.75) {
      hints.push({ id: 'fine', tone: 'positive', text: `${clean} of your ${fines.length} “Fine” visits were at places with no shared fryer reported.` })
    }
  }
  return hints
}
