import { Link } from 'react-router-dom'
import type { DishPhoto } from '../photos/photos'

export interface PhotoControls {
  available: boolean
  signedIn: boolean
  busy: boolean
  add: (file: File, dishId: string) => Promise<void>
  remove: (photo: DishPhoto) => Promise<void>
}

/** Your private photos of one dish, plus the add button. */
export function PhotoStrip({ dishId, dishName, photos, ctrl }: { dishId: string; dishName: string; photos: DishPhoto[]; ctrl: PhotoControls }) {
  if (!ctrl.available) return null
  return (
    <div className="stack" style={{ marginTop: 0 }}>
      {photos.length > 0 && (
        <ul className="row wrap" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {photos.map((p) => (
            <li key={p.id} style={{ position: 'relative' }}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open your photo of ${dishName}`}>
                <img
                  src={p.url}
                  alt={`Your photo of ${dishName}`}
                  width={72}
                  height={72}
                  loading="lazy"
                  style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)', display: 'block' }}
                />
              </a>
              <button
                className="chip"
                style={{ minHeight: 32, padding: '0 8px', marginTop: 4, fontSize: '0.75rem' }}
                disabled={ctrl.busy}
                aria-label={`Remove your photo of ${dishName}`}
                onClick={() => { if (window.confirm('Delete this photo?')) void ctrl.remove(p) }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {ctrl.signedIn ? (
        <label className="chip" style={{ width: 'fit-content', opacity: ctrl.busy ? 0.6 : 1 }}>
          {ctrl.busy ? 'Uploading…' : '📷 Add a photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={ctrl.busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = '' // lets you pick the same photo again
              if (file) void ctrl.add(file, dishId)
            }}
          />
        </label>
      ) : (
        <Link className="small" to="/profile">Sign in to add private photos</Link>
      )}
    </div>
  )
}
