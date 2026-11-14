import { useEffect, useMemo } from 'react'
import { isImageFile } from '../photos/image'
import { MAX_PHOTOS_PER_VISIT } from '../photos/visitPhotos'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../store/useAuth'

/** Choose photos to attach while logging a visit. They upload when the visit is saved. */
export function VisitPhotoPicker({ files, onChange, disabled }: { files: File[]; onChange: (f: File[]) => void; disabled?: boolean }) {
  const signedIn = useAuth((s) => !!s.user)
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  // Sign-in guidance is shown once, by the GIF picker, so we do not repeat it here.
  if (!supabaseConfigured || !signedIn) return null

  const room = MAX_PHOTOS_PER_VISIT - files.length
  return (
    <div className="stack">
      <strong>Photos</strong>
      {files.length > 0 && (
        <ul className="row wrap" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`}>
              <img src={urls[i]} alt={`Selected photo ${i + 1}`} width={72} height={72}
                style={{ objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)', display: 'block' }} />
              <button type="button" className="chip" disabled={disabled}
                style={{ minHeight: 32, padding: '0 8px', marginTop: 4, fontSize: '0.75rem' }}
                aria-label={`Remove selected photo ${i + 1}`}
                onClick={() => onChange(files.filter((_, j) => j !== i))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {room > 0 && (
        <label className="chip" style={{ width: 'fit-content', opacity: disabled ? 0.6 : 1 }}>
          📷 {files.length ? 'Add more' : 'Add photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const picked = [...(e.target.files ?? [])].filter(isImageFile).slice(0, room)
              e.target.value = ''
              if (picked.length) onChange([...files, ...picked])
            }}
          />
        </label>
      )}
      <p className="muted small" style={{ margin: 0 }}>
        Up to {MAX_PHOTOS_PER_VISIT}. Private to you. Location and camera details are removed before upload.
      </p>
    </div>
  )
}
