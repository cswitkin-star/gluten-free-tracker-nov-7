import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RestaurantCard } from '../components/RestaurantCard'
import { VisitMedia } from '../components/VisitMedia'
import { patternHints } from '../log/patterns'
import { OUTCOME_LABEL } from '../lib/labels'
import { useMatches } from '../match/useMatches'
import { removePhotosForVisit } from '../photos/visitPhotos'
import { useVisitPhotos } from '../photos/useVisitPhotos'
import { useApp } from '../store/useApp'
import { useAuth } from '../store/useAuth'
import { useData } from '../store/useCatalog'
import type { Outcome } from '../types'

const OUTCOME_BADGE: Record<Outcome, string> = { fine: 'great', mild: 'workable', glutened: 'skip' }

export default function Log() {
  const { data } = useData()
  const { items } = useMatches()
  const saved = useApp((s) => s.saved)
  const visits = useApp((s) => s.visits)
  const toggleSaved = useApp((s) => s.toggleSaved)
  const removeVisit = useApp((s) => s.removeVisit)
  const signedIn = useAuth((s) => !!s.user)
  const media = useVisitPhotos(visits.map((v) => v.id))

  const hints = useMemo(() => patternHints(visits, data), [visits, data])
  const savedItems = items.filter((i) => saved.includes(i.restaurant.id))

  return (
    <div className="stack">
      <h1>My safe list</h1>
      <p className="muted" style={{ margin: 0 }}>Private to this browser. Only you can see it.</p>

      <Link className="btn block" to="/log/new">+ Log a visit</Link>

      <section className="stack" aria-labelledby="hints-h">
        <h2 id="hints-h">Patterns</h2>
        {hints.length === 0 ? (
          <div className="card muted">
            {visits.length < 3
              ? 'Log a few visits and we will point out patterns, like where you tend to feel fine.'
              : 'No clear patterns yet. Keep logging and we will let you know.'}
          </div>
        ) : (
          hints.map((h) => (
            <div key={h.id} className={`notice ${h.tone === 'caution' ? 'warn' : ''}`}>
              {h.tone === 'caution' ? '⚠ ' : '✓ '}{h.text}
            </div>
          ))
        )}
        {hints.length > 0 && <p className="muted small" style={{ margin: 0 }}>These are patterns in your own log, not medical advice.</p>}
      </section>

      <section className="stack" aria-labelledby="saved-h">
        <h2 id="saved-h">Saved places</h2>
        {savedItems.length === 0 ? (
          <div className="empty card">
            <div className="big" aria-hidden>☆</div>
            <p>Nothing saved yet. Tap Save on a restaurant to keep it here.</p>
            <Link className="btn secondary" to="/">Find places</Link>
          </div>
        ) : (
          savedItems.map((item) => (
            <RestaurantCard
              key={item.restaurant.id}
              item={item}
              footer={<button className="chip" onClick={() => toggleSaved(item.restaurant.id)}>Remove from list</button>}
            />
          ))
        )}
      </section>

      <section className="stack" aria-labelledby="visits-h">
        <h2 id="visits-h">Visits</h2>
        {media.error && <div className="notice warn" role="alert">{media.error}</div>}
        {visits.length === 0 ? (
          <div className="empty card">
            <div className="big" aria-hidden>📓</div>
            <p>No visits yet. After you eat out, log what you had and how you felt.</p>
          </div>
        ) : (
          visits.map((v) => {
            const r = data.getRestaurant(v.restaurantId)
            return (
              <article key={v.id} className="card stack">
                <div className="row spread" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <Link to={`/restaurant/${v.restaurantId}`}><strong>{r?.name ?? 'Unknown place'}</strong></Link>
                    <div className="muted small">{v.date}</div>
                  </div>
                  <span className={`badge ${OUTCOME_BADGE[v.outcome]}`}>{OUTCOME_LABEL[v.outcome]}</span>
                </div>
                {v.dishesOrdered.length > 0 && <p style={{ margin: 0 }}><strong>Ordered:</strong> {v.dishesOrdered.join(', ')}</p>}
                {v.notes && <p style={{ margin: 0 }}>{v.notes}</p>}
                <VisitMedia visit={v} photos={media.photos.filter((p) => p.visitId === v.id)} ctrl={media} />
                <div>
                  <button
                    className="chip"
                    onClick={async () => {
                      if (!window.confirm('Delete this visit and its photos?')) return
                      if (signedIn) {
                        try {
                          await removePhotosForVisit(v.id)
                        } catch (err) {
                          console.error('Could not delete visit photos:', err)
                          window.alert('Could not delete this visit’s photos. Check your connection and try again. Nothing was deleted.')
                          return
                        }
                      }
                      removeVisit(v.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
