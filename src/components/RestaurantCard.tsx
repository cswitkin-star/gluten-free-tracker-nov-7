import { Link } from 'react-router-dom'
import { PRICE_LABEL } from '../lib/labels'
import type { Matched } from '../match/useMatches'
import { MatchBadge } from './MatchBadge'

export function RestaurantCard({ item, footer }: { item: Matched; footer?: React.ReactNode }) {
  const { restaurant: r, match } = item
  return (
    <div className="card stack">
      <Link to={`/restaurant/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="row spread" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3>{r.name}</h3>
            <p className="muted small" style={{ margin: 0 }}>
              {r.cuisine} · {PRICE_LABEL(r.price)} · {r.neighborhood}
            </p>
          </div>
          <MatchBadge label={match.label} lowConfidence={match.lowConfidence} />
        </div>
        <p style={{ margin: '8px 0 0' }}>{match.reason}</p>
      </Link>
      {footer}
    </div>
  )
}
