import type { Catalog } from '../types'
import { dishes } from './seed/dishes'
import { restaurants } from './seed/restaurants'
import { reviews } from './seed/reviews'
import { safety } from './seed/safety'

/**
 * The only place the UI gets the restaurant catalog from.
 * The MVP ships with bundled sample data (`LocalCatalogRepo`). To go live,
 * add a `SupabaseCatalogRepo` (and Google Places ingest) that implements the
 * same interface and swap it in `src/data/index.ts`. Screens do not change.
 */
export interface CatalogRepo {
  load(): Promise<Catalog>
}

export const LocalCatalogRepo: CatalogRepo = {
  async load() {
    return { restaurants, safety, dishes, reviews }
  },
}
