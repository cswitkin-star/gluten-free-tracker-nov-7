import type { FryerStatus, KitchenStatus, RestaurantSafety, StaffKnowledge } from '../../types'

// SAMPLE DATA: invented safety signals for fictional restaurants.
// Dates are spread out on purpose so the app can show fresh and stale facts.

type Row = [
  id: string,
  fryer: FryerStatus,
  kitchen: KitchenStatus,
  staff: StaffKnowledge,
  flagged: boolean,
  confirmed: string | null,
]

const rows: Row[] = [
  ['r01', 'dedicated', 'dedicated_gf', 'knowledgeable', true, '2026-10-28'],
  ['r02', 'dedicated', 'shared', 'some', true, '2026-09-14'],
  ['r03', 'shared', 'shared', 'some', false, '2026-08-02'],
  ['r04', 'shared', 'shared', 'unaware', false, '2026-06-20'],
  ['r05', 'no_fryer', 'separate_prep', 'knowledgeable', true, '2026-11-02'],
  ['r06', 'shared', 'shared', 'some', true, '2026-10-05'],
  ['r07', 'shared', 'shared', 'some', true, '2026-09-30'],
  ['r08', 'no_fryer', 'separate_prep', 'knowledgeable', true, '2026-07-11'],
  ['r09', 'no_fryer', 'shared', 'unaware', false, '2026-05-01'],
  ['r10', 'shared', 'shared', 'knowledgeable', true, '2026-10-19'],
  ['r11', 'no_fryer', 'separate_prep', 'knowledgeable', true, '2026-11-08'],
  ['r12', 'shared', 'shared', 'some', false, '2026-04-10'],
  ['r13', 'no_fryer', 'shared', 'unaware', false, '2026-08-25'],
  ['r14', 'shared', 'shared', 'some', false, '2026-10-01'],
  ['r15', 'no_fryer', 'dedicated_gf', 'knowledgeable', true, '2026-11-10'],
  ['r16', 'shared', 'shared', 'some', true, '2026-09-02'],
  ['r17', 'shared', 'shared', 'unaware', false, '2026-03-15'],
  ['r18', 'dedicated', 'separate_prep', 'knowledgeable', true, '2026-10-12'],
  ['r19', 'shared', 'separate_prep', 'knowledgeable', true, '2026-10-22'],
  // Low-data example: nothing confirmed yet.
  ['r20', 'unknown', 'unknown', 'unknown', false, null],
]

export const safety: RestaurantSafety[] = rows.map(
  ([restaurantId, fryer, kitchen, staffKnowledge, flaggedGfFood, lastConfirmed]) => ({
    restaurantId,
    fryer,
    kitchen,
    staffKnowledge,
    flaggedGfFood,
    lastConfirmed,
  }),
)
