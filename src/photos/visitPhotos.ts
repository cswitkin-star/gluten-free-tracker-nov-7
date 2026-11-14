import { supabase } from '../lib/supabase'
import { toCleanJpeg } from './image'
import { BUCKET, photoPath, signUrls } from './photos'

export const MAX_PHOTOS_PER_VISIT = 6

export interface VisitPhoto {
  id: string
  visitId: string
  restaurantId: string
  path: string
  createdAt: string
  /** Temporary link to view the private file. Expires after an hour. */
  url: string
}

const need = () => {
  if (!supabase) throw new Error('Photos are not available right now.')
  return supabase
}

/** Your photos for the given visits, newest first, with temporary viewing links. */
export async function listVisitPhotos(visitIds: string[]): Promise<VisitPhoto[]> {
  if (!visitIds.length) return []
  const { data, error } = await need()
    .from('visit_photos')
    .select('id, visit_id, restaurant_id, path, created_at')
    .in('visit_id', visitIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  const urls = await signUrls(data.map((r) => r.path))
  return data
    .filter((r) => urls.has(r.path))
    .map((r) => ({
      id: r.id, visitId: r.visit_id, restaurantId: r.restaurant_id, path: r.path, createdAt: r.created_at, url: urls.get(r.path)!,
    }))
}

/** Shrinks and strips metadata, uploads, then records it. Cleans up the file if recording fails. */
export async function addVisitPhoto(userId: string, file: File, visitId: string, restaurantId: string): Promise<void> {
  const sb = need()
  const blob = await toCleanJpeg(file)
  const path = photoPath(userId)
  const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (up.error) throw up.error
  const ins = await sb.from('visit_photos').insert({ visit_id: visitId, restaurant_id: restaurantId, path })
  if (ins.error) {
    await sb.storage.from(BUCKET).remove([path])
    throw ins.error
  }
}

export async function removeVisitPhoto(photo: Pick<VisitPhoto, 'id' | 'path'>): Promise<void> {
  const sb = need()
  const del = await sb.from('visit_photos').delete().eq('id', photo.id)
  if (del.error) throw del.error
  await sb.storage.from(BUCKET).remove([photo.path])
}

/** Deletes every photo attached to one visit (used when the visit itself is deleted). */
export async function removePhotosForVisit(visitId: string): Promise<void> {
  const sb = need()
  const { data, error } = await sb.from('visit_photos').select('id, path').eq('visit_id', visitId)
  if (error) throw error
  if (!data.length) return
  const del = await sb.from('visit_photos').delete().in('id', data.map((r) => r.id))
  if (del.error) throw del.error
  await sb.storage.from(BUCKET).remove(data.map((r) => r.path))
}
