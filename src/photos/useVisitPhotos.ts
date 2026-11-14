import { useCallback, useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../store/useAuth'
import { isImageFile } from './image'
import { addVisitPhoto, listVisitPhotos, MAX_PHOTOS_PER_VISIT, removeVisitPhoto, type VisitPhoto } from './visitPhotos'

/** Plain message for the user. The real error goes to the console for debugging. */
export function photoErrorText(e: unknown): string {
  console.error('Photo error:', e)
  if (e instanceof Error && !('statusCode' in e) && !('status' in e)) return e.message
  const text = String((e as { message?: string })?.message ?? '').toLowerCase()
  if (text.includes('visit photo limit')) return `A visit can have up to ${MAX_PHOTOS_PER_VISIT} photos.`
  if (text.includes('limit reached')) return 'You have reached the limit of 100 photos. Remove one to add another.'
  if (text.includes('exceeded') || text.includes('too large') || text.includes('payload')) return 'That photo is too large.'
  return 'Could not save the photo. Please try again.'
}

/** Your private photos for a set of visits. Needs a signed-in account. */
export function useVisitPhotos(visitIds: string[]) {
  const userId = useAuth((s) => s.user?.id ?? null)
  const [photos, setPhotos] = useState<VisitPhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const key = visitIds.join(',')

  const reload = useCallback(async () => {
    if (!userId) return setPhotos([])
    try {
      setPhotos(await listVisitPhotos(key ? key.split(',') : []))
    } catch (e) {
      setError(photoErrorText(e))
    }
  }, [userId, key])

  useEffect(() => {
    // Fetching is the external system we are syncing with; state updates happen after it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const add = async (file: File, visitId: string, restaurantId: string) => {
    if (!userId) return
    if (!isImageFile(file)) return setError('Please choose an image file.')
    setBusy(true)
    setError('')
    try {
      await addVisitPhoto(userId, file, visitId, restaurantId)
      await reload()
    } catch (e) {
      setError(photoErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (photo: VisitPhoto) => {
    setBusy(true)
    setError('')
    try {
      await removeVisitPhoto(photo)
      await reload()
    } catch (e) {
      setError(photoErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  return { available: supabaseConfigured, signedIn: !!userId, photos, busy, error, add, remove, reload }
}
