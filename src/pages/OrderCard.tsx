import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { orderCardContent } from '../copy/orderCard'
import { useApp } from '../store/useApp'
import { useData } from '../store/useCatalog'

/** Full-screen card to hold up to a server. Big text, maximum contrast. */
export default function OrderCard() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const profile = useApp((s) => s.profile)
  const { data } = useData()
  const [big, setBig] = useState(false)

  const rid = params.get('r')
  const restaurant = rid ? data.getRestaurant(rid) : undefined
  const c = orderCardContent(profile, restaurant ? data.getDishes(restaurant.id) : [])

  return (
    <div className="order-card" style={big ? { fontSize: '1.25em' } : undefined}>
      <div className="row spread">
        <button className="btn secondary" style={{ color: '#000', borderColor: '#000' }} onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}>
          ← Close
        </button>
        <button className="btn secondary" style={{ color: '#000', borderColor: '#000' }} aria-pressed={big} onClick={() => setBig(!big)}>
          {big ? 'Smaller text' : 'Larger text'}
        </button>
      </div>
      <h1>{c.heading}</h1>
      <ul>
        {c.lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
      {c.notes.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>For {restaurant?.name.replace(' (Sample)', '')}:</p>
          <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      )}
      <p style={{ fontWeight: 700 }}>{c.thanks}</p>
    </div>
  )
}
