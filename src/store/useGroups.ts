import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReplyPayload, ShareOption, Vote } from '../group/share'

export interface Group {
  id: string
  title: string
  size: number
  createdAt: string
  options: ShareOption[]
  /** voter name -> option id -> vote */
  votes: Record<string, Record<string, Vote>>
}

interface GroupsState {
  groups: Group[]
  addGroup: (g: Omit<Group, 'votes'>) => void
  removeGroup: (id: string) => void
  /** Returns false if this device does not have that group. */
  mergeReply: (r: ReplyPayload) => boolean
}

export const useGroups = create<GroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      addGroup: (g) => set((s) => ({ groups: [{ ...g, votes: {} }, ...s.groups] })),
      removeGroup: (id) => set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
      mergeReply: (r) => {
        const group = get().groups.find((g) => g.id === r.g)
        if (!group) return false
        const ids = new Set(group.options.map((o) => o.id))
        const clean = Object.fromEntries(Object.entries(r.votes).filter(([id]) => ids.has(id)))
        const who = r.who.trim().slice(0, 30) || 'Friend'
        set((s) => ({
          groups: s.groups.map((g) => (g.id === r.g ? { ...g, votes: { ...g.votes, [who]: clean } } : g)),
        }))
        return true
      },
    }),
    { name: 'gf-groups-v1' },
  ),
)
