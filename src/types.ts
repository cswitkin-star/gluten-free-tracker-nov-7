// Core data model. Mirrors the tables in the build brief so a later move to
// Postgres/Supabase is mechanical. NOTE: erasableSyntaxOnly is on, so no enums.

export type Tolerance = 'celiac' | 'sensitive' | 'preference'
export type Allergen = 'dairy' | 'nuts' | 'soy'
export type Price = 1 | 2 | 3 | 4

/** Shown to the user as "reported" facts, never as guarantees. */
export type FryerStatus = 'dedicated' | 'shared' | 'no_fryer' | 'unknown'
export type KitchenStatus = 'dedicated_gf' | 'separate_prep' | 'shared' | 'unknown'
export type StaffKnowledge = 'knowledgeable' | 'some' | 'unaware' | 'unknown'

export type GFStatus = 'gf_as_served' | 'can_be_gf' | 'not_gf'
export type DishSource = 'seed' | 'user'
export type Outcome = 'fine' | 'mild' | 'glutened'

/** Preferences the user sets during onboarding. */
export interface Profile {
  tolerance: Tolerance
  needsDedicatedFryer: boolean
  needsSeparatePrep: boolean
  wantsGfBeer: boolean
  wantsGfDesserts: boolean
  allergies: Allergen[]
  onboarded: boolean
}

export interface Hours {
  /** Hours since midnight, local NYC time. close > 24 means it runs past midnight. */
  open: number
  close: number
}

export interface Restaurant {
  id: string
  /** Sample data uses `sample_*` ids. Real ones come from Google Places later. */
  googlePlaceId: string
  name: string
  neighborhood: string
  address: string
  lat: number
  lng: number
  cuisine: string
  price: Price
  hours: Hours
  blurb: string
  hasGfBeer: boolean
  hasGfDesserts: boolean
  sample: boolean
}

/** One row per restaurant: safety signals, kept separate from taste. */
export interface RestaurantSafety {
  restaurantId: string
  fryer: FryerStatus
  kitchen: KitchenStatus
  staffKnowledge: StaffKnowledge
  /** Does the menu itself flag gluten-free items? */
  flaggedGfFood: boolean
  /** ISO date (YYYY-MM-DD) these facts were last confirmed, or null if never. */
  lastConfirmed: string | null
}

export interface Dish {
  id: string
  restaurantId: string
  name: string
  gfStatus: GFStatus
  /** What to ask for, e.g. "no soy sauce, ask for tamari". */
  modificationNote: string
  fried: boolean
  allergens: Allergen[]
  lastConfirmed: string
  source: DishSource
}

export interface Review {
  id: string
  restaurantId: string
  author: string
  /** Everything about a review is read in light of this. */
  reviewerTolerance: Tolerance
  /** Safety experience and taste are rated separately on purpose. */
  safetyRating: 1 | 2 | 3 | 4 | 5 | null
  tasteRating: 1 | 2 | 3 | 4 | 5
  text: string
  date: string
  sample: boolean
}

export interface Visit {
  id: string
  restaurantId: string
  dishesOrdered: string[]
  outcome: Outcome
  date: string
  notes: string
}

export interface Catalog {
  restaurants: Restaurant[]
  safety: RestaurantSafety[]
  dishes: Dish[]
  reviews: Review[]
}

export type MatchLabel = 'great' | 'workable' | 'skip'

export interface MatchResult {
  label: MatchLabel
  /** One line, plain language. */
  reason: string
  /** Things to ask the restaurant about, shown for "workable". */
  ask: string[]
  /** True when key facts are old or missing. */
  lowConfidence: boolean
}
