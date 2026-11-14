export const MAX_DIMENSION = 1600
export const JPEG_QUALITY = 0.85
/** Matches the bucket's limit. We shrink first, so real photos land far below this. */
export const MAX_BYTES = 5 * 1024 * 1024

/** Scales (w, h) down to fit inside a max x max box, keeping the aspect ratio. Never scales up. */
export function fitWithin(w: number, h: number, max: number = MAX_DIMENSION): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h))
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) }
}

export const isImageFile = (f: File) => f.type.startsWith('image/')

/**
 * Re-encodes a picked image as a smaller JPEG. Drawing onto a canvas drops all metadata,
 * including GPS location, camera details and timestamps, so none of it is ever uploaded.
 */
export async function toCleanJpeg(file: File): Promise<Blob> {
  // Applies the photo's rotation, so portrait phone photos are not sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process this image.')
    ctx.fillStyle = '#fff' // JPEG has no transparency
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new Error('Could not process this image.')
    if (blob.size > MAX_BYTES) throw new Error('That photo is too large even after shrinking.')
    return blob
  } finally {
    bitmap.close()
  }
}
