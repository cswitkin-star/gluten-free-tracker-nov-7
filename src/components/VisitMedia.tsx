import { isSafeGif } from '../gifs/giphy'
import { MAX_PHOTOS_PER_VISIT, type VisitPhoto } from '../photos/visitPhotos'
import type { Visit } from '../types'

export interface VisitPhotoControls {
  available: boolean
  signedIn: boolean
  busy: boolean
  add: (file: File, visitId: string, restaurantId: string) => Promise<void>
  remove: (photo: VisitPhoto) => Promise<void>
}

/** The GIF and photos attached to one logged visit, with add and remove for photos. */
export function VisitMedia({ visit, photos, ctrl }: { visit: Visit; photos: VisitPhoto[]; ctrl: VisitPhotoControls }) {
  const gif = isSafeGif(visit.gif) ? visit.gif : null
  const canAdd = ctrl.available && ctrl.signedIn && photos.length < MAX_PHOTOS_PER_VISIT
  if (!gif && photos.length === 0 && !canAdd) return null

  return (
    <div className="stack">
      {gif && (
        <figure style={{ margin: 0 }}>
          <img src={gif.url} alt={gif.title} width={gif.width} height={gif.height} loading="lazy"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: 12, display: 'block' }} />
          <figcaption className="muted small">GIF via GIPHY</figcaption>
        </figure>
      )}
      {photos.length > 0 && (
        <ul className="row wrap" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {photos.map((p, i) => (
            <li key={p.id}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1} from this visit`}>
                <img src={p.url} alt={`Your photo ${i + 1} from this visit`} width={72} height={72} loading="lazy"
                  style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)', display: 'block' }} />
              </a>
              <button className="chip" disabled={ctrl.busy}
                style={{ minHeight: 32, padding: '0 8px', marginTop: 4, fontSize: '0.75rem' }}
                aria-label={`Remove photo ${i + 1} from this visit`}
                onClick={() => { if (window.confirm('Delete this photo?')) void ctrl.remove(p) }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <label className="chip" style={{ width: 'fit-content', opacity: ctrl.busy ? 0.6 : 1 }}>
          {ctrl.busy ? 'Uploading…' : '📷 Add a photo'}
          <input type="file" accept="image/*" className="sr-only" disabled={ctrl.busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void ctrl.add(file, visit.id, visit.restaurantId)
            }} />
        </label>
      )}
    </div>
  )
}
