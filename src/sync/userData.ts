import type { Group } from '../store/useGroups'
import type { Dish, Profile, RestaurantSafety, Review, Visit } from '../types'

/** Everything private to a user that we sync to their account as one document. */
export interface UserData {
  v: 1
  profile: Profile
  saved: string[]
  visits: Visit[]
  userDishes: Dish[]
  safetyOverrides: Record<string, Partial<RestaurantSafety>>
  userReviews: Review[]
  groups: Group[]
}

const byId = <T extends { id: string }>(a: T[], b: T[], pick: (x: T, y: T) => T): T[] => {
  const m = new Map<string, T>()
  for (const x of [...a, ...b]) {
    const prev = m.get(x.id)
    m.set(x.id, prev ? pick(prev, x) : x)
  }
  return [...m.values()]
}

/** Runtime check so a malformed or future-version document is never applied. */
export function isUserData(x: unknown): x is UserData {
  const d = x as UserData | null
  return (
    !!d && d.v === 1 && typeof d.profile === 'object' && Array.isArray(d.saved) && Array.isArray(d.visits) &&
    Array.isArray(d.userDishes) && typeof d.safetyOverrides === 'object' && Array.isArray(d.userReviews) &&
    Array.isArray(d.groups)
  )
}

/**
 * First sign-in on a device: combine what is already here with what the account holds,
 * without losing either side. (Once a device has synced with an account, the account's
 * copy simply wins on load, so deletions on another device are respected.)
 */
export function mergeUserData(local: UserData, remote: UserData | null): UserData {
  if (!remote) return local
  const safety: UserData['safetyOverrides'] = { ...remote.safetyOverrides }
  for (const [id, l] of Object.entries(local.safetyOverrides)) {
    const r = safety[id]
    safety[id] = !r || (l.lastConfirmed ?? '') >= (r.lastConfirmed ?? '') ? { ...r, ...l } : r
  }
  const groups = byId(remote.groups, local.groups, (r, l) => ({ ...r, votes: { ...r.votes, ...l.votes } }))
  return {
    v: 1,
    // If the account already has a finished profile, that wins. Otherwise keep this device's.
    profile: remote.profile.onboarded ? remote.profile : local.profile,
    saved: [...new Set([...remote.saved, ...local.saved])],
    visits: byId(remote.visits, local.visits, (r) => r).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)),
    userDishes: byId(remote.userDishes, local.userDishes, (r, l) => (l.lastConfirmed >= r.lastConfirmed ? l : r)),
    safetyOverrides: safety,
    userReviews: byId(remote.userReviews, local.userReviews, (r) => r),
    groups,
  }
}
