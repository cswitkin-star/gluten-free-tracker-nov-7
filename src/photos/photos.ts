import { supabase } from '../lib/supabase'
import { toCleanJpeg } from './image'

const BUCKET = 'dish-photos'
const URL_TTL_SECONDS = 60 * 60

export interface DishPhoto {
  id: string
  restaurantId: string
  dishId: string
  path: string
  createdAt: string
  /** Temporary link to view the private file. Expires after an hour. */
  url: string
}

/** "<user id>/<random>.jpg". The first folder must be the user's id (storage rules enforce it). */
export const photoPath = (userId: string, id: string = crypto.randomUUID()) => `${userId}/${id}.jpg`

const need = () => {
  if (!supabase) throw new Error('Photos are not available right now.')
  return supabase
}

/** Your photos for one restaurant, with temporary viewing links. */
export async function listPhotos(restaurantId: string): Promise<DishPhoto[]> {
  const sb = need()
  const { data, error } = await sb
    .from('dish_photos')
    .select('id, restaurant_id, dish_id, path, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!data.length) return []
  const { data: signed, error: signErr } = await sb.storage.from(BUCKET).createSignedUrls(data.map((r) => r.path), URL_TTL_SECONDS)
  if (signErr) throw signErr
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl]))
  return data
    .filter((r) => urls.get(r.path))
    .map((r) => ({
      id: r.id, restaurantId: r.restaurant_id, dishId: r.dish_id, path: r.path, createdAt: r.created_at, url: urls.get(r.path)!,
    }))
}

/** Shrinks and strips metadata, uploads, then records it. Cleans up the file if recording fails. */
export async function addPhoto(userId: string, file: File, restaurantId: string, dishId: string): Promise<void> {
  const sb = need()
  const blob = await toCleanJpeg(file)
  const path = photoPath(userId)
  const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (up.error) throw up.error
  const ins = await sb.from('dish_photos').insert({ restaurant_id: restaurantId, dish_id: dishId, path })
  if (ins.error) {
    await sb.storage.from(BUCKET).remove([path])
    throw ins.error
  }
}

export async function removePhoto(photo: Pick<DishPhoto, 'id' | 'path'>): Promise<void> {
  const sb = need()
  const del = await sb.from('dish_photos').delete().eq('id', photo.id)
  if (del.error) throw del.error
  await sb.storage.from(BUCKET).remove([photo.path])
}

/** Removes every photo you uploaded (used by "Erase my data"). */
export async function removeAllMyPhotos(): Promise<void> {
  const sb = need()
  const { data, error } = await sb.from('dish_photos').select('id, path')
  if (error) throw error
  if (!data.length) return
  const rows = await sb.from('dish_photos').delete().in('id', data.map((r) => r.id))
  if (rows.error) throw rows.error
  await sb.storage.from(BUCKET).remove(data.map((r) => r.path))
}
