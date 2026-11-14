import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { Matched } from '../match/useMatches'

// Colored dots instead of Leaflet's default pin images (which break under bundlers).
const COLORS = { great: '#1f6b46', workable: '#b7791f', skip: '#b42318' } as const
const SYMBOL = { great: '✓', workable: '?', skip: '✕' } as const

function icon(label: keyof typeof COLORS) {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${COLORS[label]};color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${SYMBOL[label]}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export function MapView({ items }: { items: Matched[] }) {
  return (
    <div className="map" role="region" aria-label="Map of restaurants. The list below has the same information.">
      <MapContainer center={[40.73, -73.97]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items.map(({ restaurant: r, match }) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={icon(match.label)}>
            <Popup>
              <strong>{r.name}</strong>
              <br />
              {match.label === 'great' ? 'Great for you' : match.label === 'workable' ? 'Workable' : 'Skip'}
              <br />
              <Link to={`/restaurant/${r.id}`}>View details</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
