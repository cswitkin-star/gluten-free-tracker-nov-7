import { ALLERGEN_LABEL } from '../lib/labels'
import { daysBetween, timeAgo, todayISO } from '../lib/dates'
import type { Dish, MatchResult, Profile, Restaurant, RestaurantSafety } from '../types'

/** Safety facts older than this are treated as stale and lower our confidence. */
export const STALE_DAYS = 180

export interface MatchInput {
  profile: Profile
  restaurant: Restaurant
  safety: RestaurantSafety
  dishes: Dish[]
  /** YYYY-MM-DD. Injectable so tests are deterministic. */
  today?: string
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Personal match: the same restaurant gets a different answer depending on the
 * user's tolerance. Pure function, no IO.
 *
 * - celiac:     needs reported cross-contact controls. Unknown or stale safety info is NOT assumed fine.
 * - sensitive:  tolerates a shared fryer, but wants staff who understand the request.
 * - preference: mostly about whether there is good GF food to eat, rarely "skip".
 *
 * Wording is deliberately cautious ("reported", "likely"). We never say "safe".
 */
export function computeMatch({ profile, restaurant, safety, dishes, today = todayISO() }: MatchInput): MatchResult {
  const level = profile.tolerance
  const ageDays = safety.lastConfirmed ? daysBetween(safety.lastConfirmed, today) : null
  const stale = ageDays === null || ageDays > STALE_DAYS
  const confirmed = timeAgo(safety.lastConfirmed, today)

  const factsUnknown = safety.fryer === 'unknown' && safety.kitchen === 'unknown' && safety.staffKnowledge === 'unknown'
  const lowConfidence = stale || factsUnknown

  // Dishes the user could actually eat, after allergies.
  const gfDishes = dishes.filter((d) => d.gfStatus !== 'not_gf')
  const blockedAllergens = new Set<string>()
  const afterAllergy = gfDishes.filter((d) => {
    const hit = d.allergens.filter((a) => profile.allergies.includes(a))
    hit.forEach((a) => blockedAllergens.add(a))
    return hit.length === 0
  })
  // A celiac should not rely on fried dishes from a shared fryer.
  const usable =
    level === 'celiac' && safety.fryer === 'shared' ? afterAllergy.filter((d) => !d.fried) : afterAllergy
  const asServed = usable.filter((d) => d.gfStatus === 'gf_as_served')
  const fryerBlockedOnly = level === 'celiac' && safety.fryer === 'shared' && afterAllergy.length > 0 && usable.length === 0

  const skip = (reason: string): MatchResult => ({ label: 'skip', reason, ask: [], lowConfidence })
  const noDishData = dishes.length === 0

  // ---- Hard stops common to every level ----
  if (!noDishData && gfDishes.length === 0) return skip('No gluten-free dishes reported here.')
  if (gfDishes.length > 0 && afterAllergy.length === 0) {
    const names = [...blockedAllergens].map((a) => ALLERGEN_LABEL[a as keyof typeof ALLERGEN_LABEL].toLowerCase()).join(' / ')
    return skip(`The gluten-free dishes reported here contain ${names}.`)
  }

  // ---- Requirements the user turned on (celiac and sensitive treat them as must-haves) ----
  if (level !== 'preference') {
    if (profile.needsDedicatedFryer && safety.fryer === 'shared') {
      return skip('You want a dedicated fryer, and this place reports a shared one.')
    }
    if (profile.needsSeparatePrep && safety.kitchen === 'shared') {
      return skip('You want a separate prep area, and this place reports a shared kitchen.')
    }
  }

  const asks: string[] = []
  const ask = (s: string) => asks.push(s)
  if (stale && !factsUnknown) ask(`Facts were last confirmed ${confirmed}. Double-check when you arrive.`)

  // ---- Celiac / strict ----
  if (level === 'celiac') {
    if (factsUnknown) {
      return skip('Not enough reported info yet to recommend it. Call ahead, or help fill it in.')
    }
    if (fryerBlockedOnly) return skip('Only fried GF options, and the fryer is reported shared.')
    if (safety.kitchen === 'shared' && safety.staffKnowledge === 'unaware') {
      return skip('Shared kitchen, and staff are reported unfamiliar with gluten-free needs.')
    }
    if (usable.length === 0) return skip('Not enough reported gluten-free dishes to recommend it.')

    const fryerOk = safety.fryer === 'dedicated' || safety.fryer === 'no_fryer'
    const prepOk = safety.kitchen === 'dedicated_gf' || safety.kitchen === 'separate_prep'
    const staffOk = safety.staffKnowledge === 'knowledgeable'

    if (!stale && safety.kitchen === 'dedicated_gf' && fryerOk) {
      return { label: 'great', reason: `Reported dedicated gluten-free kitchen, confirmed ${confirmed}.`, ask: [], lowConfidence }
    }
    if (!stale && fryerOk && prepOk && staffOk && safety.flaggedGfFood) {
      return {
        label: 'great',
        reason: `Reported separate prep, no shared fryer and knowledgeable staff, confirmed ${confirmed}.`,
        ask: [],
        lowConfidence,
      }
    }

    if (safety.fryer === 'shared') ask('Which items share the fryer, and whether they can cook yours separately')
    if (safety.fryer === 'unknown') ask('Whether fried food shares a fryer')
    if (safety.kitchen === 'shared') ask('How they prevent cross-contact on shared surfaces')
    if (safety.kitchen === 'unknown') ask('Whether they have a separate prep area')
    if (!staffOk) ask('Whether staff are trained on gluten-free orders')
    const first = asks[0] ?? 'the details'
    return { label: 'workable', reason: `Workable. Ask about: ${first.charAt(0).toLowerCase()}${first.slice(1)}.`, ask: asks, lowConfidence }
  }

  // ---- Sensitive ----
  if (level === 'sensitive') {
    if (usable.length === 0) {
      return { label: 'workable', reason: 'Little reported info yet. Ask what they can make gluten-free.', ask: ['What they can make gluten-free'], lowConfidence }
    }
    const staffOk = safety.staffKnowledge === 'knowledgeable' || safety.staffKnowledge === 'some'
    const prepOk = safety.kitchen === 'dedicated_gf' || safety.kitchen === 'separate_prep'
    if (!stale && (safety.kitchen === 'dedicated_gf' || (prepOk && staffOk && asServed.length > 0) || (safety.flaggedGfFood && staffOk && asServed.length > 0))) {
      return {
        label: 'great',
        reason: `${plural(usable.length, 'GF dish')} reported, staff likely familiar. Confirmed ${confirmed}.`,
        ask: [],
        lowConfidence,
      }
    }
    if (safety.fryer === 'shared') ask('Fryer sharing, if you plan to order fried food')
    if (safety.kitchen === 'shared') ask('How they handle shared surfaces')
    if (!staffOk) ask('Whether staff are familiar with gluten-free orders')
    const first = asks[0] ?? 'the details'
    return { label: 'workable', reason: `Workable. Ask about: ${first.charAt(0).toLowerCase()}${first.slice(1)}.`, ask: asks, lowConfidence }
  }

  // ---- Preference: it is about whether there is good GF food ----
  const wants: string[] = []
  if (profile.wantsGfBeer && restaurant.hasGfBeer) wants.push('GF beer')
  if (profile.wantsGfDesserts && restaurant.hasGfDesserts) wants.push('GF dessert')
  const wantsText = wants.length ? ` Plus ${wants.join(' and ')}.` : ''

  if (usable.length === 0) {
    return { label: 'workable', reason: 'Little reported info yet. Worth a look at the menu.', ask: ['What they can make gluten-free'], lowConfidence }
  }
  // "Great" needs real choice: two GF-as-served dishes, or one plus several that can be adjusted.
  if (asServed.length >= 2 || (asServed.length >= 1 && usable.length >= 3)) {
    return {
      label: 'great',
      reason: `${plural(usable.length, 'GF dish')}, ${asServed.length} gluten-free as served.${wantsText}`,
      ask: [],
      lowConfidence,
    }
  }
  const mod = usable.find((d) => d.gfStatus === 'can_be_gf')
  if (mod?.modificationNote) ask(`${mod.name}: ${mod.modificationNote}`)
  return {
    label: 'workable',
    reason: mod ? `Few options. ${mod.name} works if you ask: ${mod.modificationNote || 'request it gluten-free'}`.slice(0, 120) : `Few options.${wantsText}`,
    ask: asks,
    lowConfidence,
  }
}

export const LABEL_RANK = { great: 0, workable: 1, skip: 2 } as const
