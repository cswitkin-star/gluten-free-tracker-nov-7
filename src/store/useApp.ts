import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayISO } from '../lib/dates'
import type { Dish, Gif, Outcome, Profile, RestaurantSafety, Review, Visit } from '../types'

export const DEFAULT_PROFILE: Profile = {
  tolerance: 'celiac',
  needsDedicatedFryer: false,
  needsSeparatePrep: false,
  wantsGfBeer: false,
  wantsGfDesserts: false,
  allergies: [],
  onboarded: false,
}

const uid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

interface AppState {
  profile: Profile
  /** Restaurant ids on the user's private safe list. */
  saved: string[]
  visits: Visit[]
  /** User-created dishes and corrections. A dish with a seed id overrides the seed row. */
  userDishes: Dish[]
  /** User-confirmed or corrected safety facts, merged over the catalog. */
  safetyOverrides: Record<string, Partial<RestaurantSafety>>
  userReviews: Review[]

  setProfile: (p: Partial<Profile>) => void
  resetAll: () => void
  toggleSaved: (restaurantId: string) => void
  addVisit: (v: { restaurantId: string; dishesOrdered: string[]; outcome: Outcome; notes: string; date?: string; gif?: Gif }) => Visit
  removeVisit: (id: string) => void
  upsertDish: (d: Omit<Dish, 'id' | 'source' | 'lastConfirmed'> & { id?: string }) => void
  /** "Still accurate?" on a dish. */
  confirmDish: (dish: Dish) => void
  /** Confirm and optionally correct safety facts. */
  updateSafety: (restaurantId: string, patch: Partial<Omit<RestaurantSafety, 'restaurantId' | 'lastConfirmed'>>) => void
  addReview: (r: Omit<Review, 'id' | 'sample' | 'date' | 'author' | 'reviewerTolerance'>) => void
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      saved: [],
      visits: [],
      userDishes: [],
      safetyOverrides: {},
      userReviews: [],

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      resetAll: () =>
        set({ profile: DEFAULT_PROFILE, saved: [], visits: [], userDishes: [], safetyOverrides: {}, userReviews: [] }),

      toggleSaved: (id) =>
        set((s) => ({ saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),

      addVisit: ({ date, ...v }) => {
        const visit: Visit = { id: uid('v'), date: date ?? todayISO(), ...v }
        set((s) => ({ visits: [visit, ...s.visits] }))
        return visit
      },
      removeVisit: (id) => set((s) => ({ visits: s.visits.filter((v) => v.id !== id) })),

      upsertDish: ({ id, ...rest }) =>
        set((s) => {
          const dish: Dish = { ...rest, id: id ?? uid('ud'), source: 'user', lastConfirmed: todayISO() }
          return { userDishes: [...s.userDishes.filter((d) => d.id !== dish.id), dish] }
        }),
      confirmDish: (dish) =>
        set((s) => ({
          userDishes: [
            ...s.userDishes.filter((d) => d.id !== dish.id),
            { ...dish, lastConfirmed: todayISO(), source: 'user' },
          ],
        })),

      updateSafety: (restaurantId, patch) =>
        set((s) => ({
          safetyOverrides: {
            ...s.safetyOverrides,
            [restaurantId]: { ...s.safetyOverrides[restaurantId], ...patch, lastConfirmed: todayISO() },
          },
        })),

      addReview: (r) => {
        const { profile } = get()
        const review: Review = {
          ...r,
          id: uid('rev'),
          author: 'You',
          reviewerTolerance: profile.tolerance,
          date: todayISO(),
          sample: false,
        }
        set((s) => ({ userReviews: [review, ...s.userReviews] }))
      },
    }),
    { name: 'gf-dining-v1' },
  ),
)
