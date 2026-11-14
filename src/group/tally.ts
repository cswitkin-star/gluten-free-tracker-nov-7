import type { ShareOption, Vote } from './share'

export interface TallyRow {
  option: ShareOption
  yes: number
  maybe: number
  no: number
  score: number
  leading: boolean
}

const POINTS: Record<Vote, number> = { yes: 2, maybe: 1, no: 0 }

/** votes: voter name -> option id -> vote. Highest score wins; fewer "no" breaks ties. */
export function tally(options: ShareOption[], votes: Record<string, Record<string, Vote>>): TallyRow[] {
  const rows = options.map((option) => {
    const row = { option, yes: 0, maybe: 0, no: 0, score: 0, leading: false }
    for (const byOption of Object.values(votes)) {
      const v = byOption[option.id]
      if (!v) continue
      row[v] += 1
      row.score += POINTS[v]
    }
    return row
  })
  const hasVotes = rows.some((r) => r.yes + r.maybe + r.no > 0)
  const best = [...rows].sort((a, b) => b.score - a.score || a.no - b.no)[0]
  if (hasVotes && best) {
    for (const r of rows) r.leading = r.score === best.score && r.no === best.no
  }
  return rows
}
