import { useCallback, useEffect, useState } from 'react'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from '../store/useAuth'
import { addPhoto, listPhotos, removePhoto, type DishPhoto } from './photos'
import { isImageFile } from './image'

/** Plain message for the user. The real error goes to the console for debugging. */
function message(e: unknown): string {
  console.error('Photo error:', e)
  // Our own errors (e.g. "That photo is too large") are already written for people.
  if (e instanceof Error && !('statusCode' in e) && !('status' in e)) return e.message
  const text = String((e as { message?: string })?.message ?? '').toLowerCase()
  if (text.includes('limit reached')) return 'You have reached the limit of 100 photos. Remove one to add another.'
  if (text.includes('exceeded') || text.includes('too large') || text.includes('payload')) return 'That photo is too large.'
  return 'Could not save the photo. Please try again.'
}

/** Your private photos for one restaurant. Needs a signed-in account. */
export function usePhotos(restaurantId: string) {
  const user = useAuth((s) => s.user)
  const userId = user?.id ?? null
  const [photos, setPhotos] = useState<DishPhoto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!userId) return setPhotos([])
    try {
      setPhotos(await listPhotos(restaurantId))
    } catch (e) {
      setError(message(e))
    }
  }, [userId, restaurantId])

  useEffect(() => {
    // Fetching is the external system we are syncing with; state updates happen after it resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const add = async (file: File, dishId: string) => {
    if (!userId) return
    if (!isImageFile(file)) return setError('Please choose an image file.')
    setBusy(true)
    setError('')
    try {
      await addPhoto(userId, file, restaurantId, dishId)
      await reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (photo: DishPhoto) => {
    setBusy(true)
    setError('')
    try {
      await removePhoto(photo)
      await reload()
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy(false)
    }
  }

  return { available: supabaseConfigured, signedIn: !!userId, photos, busy, error, add, remove }
}
