import type { Allergen, FryerStatus, GFStatus, KitchenStatus, Outcome, StaffKnowledge, Tolerance } from '../types'

export const TOLERANCE_LABEL: Record<Tolerance, string> = {
  celiac: 'Celiac / strict',
  sensitive: 'Sensitive',
  preference: 'Preference',
}

export const TOLERANCE_DESC: Record<Tolerance, string> = {
  celiac: 'I have celiac disease, or I need to avoid any cross-contact.',
  sensitive: 'Gluten makes me sick, but trace amounts are usually okay.',
  preference: 'I choose to eat gluten-free. It is not a medical need.',
}

export const ALLERGEN_LABEL: Record<Allergen, string> = { dairy: 'Dairy', nuts: 'Nuts', soy: 'Soy' }

export const FRYER_LABEL: Record<FryerStatus, string> = {
  dedicated: 'Reported dedicated fryer',
  shared: 'Reported shared fryer',
  no_fryer: 'No fryer reported',
  unknown: 'Fryer: not reported yet',
}

export const KITCHEN_LABEL: Record<KitchenStatus, string> = {
  dedicated_gf: 'Reported dedicated GF kitchen',
  separate_prep: 'Reported separate GF prep area',
  shared: 'Reported shared kitchen',
  unknown: 'Kitchen: not reported yet',
}

export const STAFF_LABEL: Record<StaffKnowledge, string> = {
  knowledgeable: 'Staff reported knowledgeable',
  some: 'Staff reported somewhat familiar',
  unaware: 'Staff reported unfamiliar',
  unknown: 'Staff: not reported yet',
}

export const GF_STATUS_LABEL: Record<GFStatus, string> = {
  gf_as_served: 'GF as served',
  can_be_gf: 'Can be made GF',
  not_gf: 'Not GF',
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  fine: 'Fine',
  mild: 'Mild reaction',
  glutened: 'Got glutened',
}

export const PRICE_LABEL = (p: number) => '$'.repeat(p)
