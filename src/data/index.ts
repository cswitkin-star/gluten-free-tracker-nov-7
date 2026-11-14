import { supabase } from '../lib/supabase'
import { LocalCatalogRepo, type CatalogRepo } from './catalog'
import { createSupabaseCatalogRepo } from './supabaseCatalog'

/**
 * The catalog comes from Supabase when VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY are set. If those are missing, or the request
 * fails (offline, project paused), we fall back to the bundled sample data so
 * the app always opens.
 */
export const catalogSource: { current: 'supabase' | 'local' } = { current: supabase ? 'supabase' : 'local' }

export const catalogRepo: CatalogRepo = {
  async load() {
    if (supabase) {
      try {
        const catalog = await createSupabaseCatalogRepo(supabase).load()
        catalogSource.current = 'supabase'
        return catalog
      } catch (err) {
        console.warn('Supabase unavailable, using bundled sample data.', err)
      }
    }
    catalogSource.current = 'local'
    return LocalCatalogRepo.load()
  },
}
