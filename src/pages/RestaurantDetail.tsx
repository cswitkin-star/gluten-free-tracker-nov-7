import { Link, useParams } from 'react-router-dom'
import { DishSection } from '../components/DishSection'
import { ShareButton } from '../components/ShareButton'
import { MatchBadge } from '../components/MatchBadge'
import { ReviewSection } from '../components/ReviewSection'
import { SafetyPanel } from '../components/SafetyPanel'
import { DISCLAIMER_LONG, SAMPLE_DATA_NOTICE } from '../copy'
import { formatHour } from '../lib/dates'
import { inviteUrl, toShareOption } from '../group/share'
import { PRICE_LABEL } from '../lib/labels'
import { computeMatch } from '../match/match'
import { useApp } from '../store/useApp'
import { useData } from '../store/useCatalog'

export default function RestaurantDetail() {
  const { id = '' } = useParams()
  const { ready, data } = useData()
  const profile = useApp((s) => s.profile)
  const saved = useApp((s) => s.saved.includes(id))
  const toggleSaved = useApp((s) => s.toggleSaved)

  if (!ready) return <p className="muted">Loading…</p>
  const r = data.getRestaurant(id)
  if (!r) {
    return (
      <div className="empty">
        <p>We could not find that place.</p>
        <Link className="btn" to="/">Back to discover</Link>
      </div>
    )
  }
  const safety = data.getSafety(id)
  const dishes = data.getDishes(id)
  const match = computeMatch({ profile, restaurant: r, safety, dishes })

  return (
    <div className="stack">
      <Link to="/" className="small">← All places</Link>
      <div>
        <h1>{r.name}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {r.cuisine} · {PRICE_LABEL(r.price)} · {r.neighborhood} · {formatHour(r.hours.open)}–{formatHour(r.hours.close)}
        </p>
        <p className="muted" style={{ margin: 0 }}>{r.address}</p>
      </div>

      <section className="card stack" aria-label="Your match">
        <MatchBadge label={match.label} lowConfidence={match.lowConfidence} />
        <p style={{ margin: 0, fontSize: '1.1rem' }}>{match.reason}</p>
        {match.ask.length > 0 && (
          <div>
            <strong>Good to ask:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: '1.2rem' }}>{match.ask.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
        )}
      </section>

      <div className="row wrap">
        <button className="btn" aria-pressed={saved} onClick={() => toggleSaved(id)}>{saved ? '★ Saved' : '☆ Save'}</button>
        <Link className="btn secondary" to={`/order-card?r=${id}`}>Order card</Link>
        <Link className="btn secondary" to={`/log/new?r=${id}`}>I ate here</Link>
        <ShareButton
          className="btn secondary"
          label="Suggest this place"
          text={`How about ${r.name} in ${r.neighborhood}?`}
          url={inviteUrl({ v: 1, g: `s_${r.id}`, t: `How about ${r.name}?`, n: 2, o: [toShareOption(r)] })}
        />
      </div>

      <p className="muted" style={{ margin: 0 }}>{r.blurb}</p>

      <SafetyPanel safety={safety} />
      <DishSection restaurantId={id} dishes={dishes} />
      <ReviewSection restaurantId={id} reviews={data.getReviews(id)} />

      {r.sample && <div className="notice">{SAMPLE_DATA_NOTICE}</div>}
      <p className="muted small">{DISCLAIMER_LONG}</p>
    </div>
  )
}
