// Serverless group voting: everything travels inside links.
// Invite links contain only restaurant names and a title. They never include
// the organizer's diet, tolerance or match labels.

import type { Restaurant } from '../types'

export type Vote = 'yes' | 'maybe' | 'no'

export interface ShareOption {
  id: string
  name: string
  cuisine: string
  neighborhood: string
  price: number
}

export interface InvitePayload {
  v: 1
  /** Group id, so replies can be merged on the organizer's device. */
  g: string
  /** Title, e.g. "Friday dinner". */
  t: string
  /** Group size. */
  n: number
  o: ShareOption[]
}

export interface ReplyPayload {
  v: 1
  g: string
  /** Voter's first name. */
  who: string
  votes: Record<string, Vote>
}

export function encodePayload(obj: InvitePayload | ReplyPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePayload<T>(s: string): T | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

export function isInvite(p: unknown): p is InvitePayload {
  const x = p as InvitePayload | null
  return !!x && x.v === 1 && typeof x.g === 'string' && typeof x.t === 'string' && Array.isArray(x.o) &&
    x.o.length > 0 && x.o.every((o) => typeof o?.id === 'string' && typeof o?.name === 'string')
}

export function isReply(p: unknown): p is ReplyPayload {
  const x = p as ReplyPayload | null
  return !!x && x.v === 1 && typeof x.g === 'string' && typeof x.who === 'string' && !!x.votes && typeof x.votes === 'object' &&
    Object.values(x.votes).every((v) => v === 'yes' || v === 'maybe' || v === 'no')
}

/** Base page URL (no hash), so links work on any static host. */
export function baseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`
}

export const inviteUrl = (p: InvitePayload) => `${baseUrl()}#/vote/${encodePayload(p)}`
export const replyUrl = (p: ReplyPayload) => `${baseUrl()}#/tally/${encodePayload(p)}`

/** Pull the payload out of a pasted link (or a bare payload). */
export function extractPayload(input: string): string {
  const m = input.trim().match(/#\/(?:vote|tally)\/([A-Za-z0-9_-]+)/)
  return m ? m[1] : input.trim()
}

/** The only restaurant fields that ever go into a link. */
export function toShareOption(r: Restaurant): ShareOption {
  return { id: r.id, name: r.name, cuisine: r.cuisine, neighborhood: r.neighborhood, price: r.price }
}
