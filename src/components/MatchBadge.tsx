import type { MatchLabel } from '../types'

const TEXT: Record<MatchLabel, { icon: string; text: string }> = {
  great: { icon: '✓', text: 'Great for you' },
  workable: { icon: '?', text: 'Workable' },
  skip: { icon: '✕', text: 'Skip' },
}

export function MatchBadge({ label, lowConfidence }: { label: MatchLabel; lowConfidence?: boolean }) {
  const t = TEXT[label]
  return (
    <span className={`badge ${label}`}>
      <span aria-hidden>{t.icon}</span>
      {t.text}
      {lowConfidence && <span className="small" title="Info is old or missing"> · low data</span>}
    </span>
  )
}
