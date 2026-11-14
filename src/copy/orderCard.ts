import type { Dish, Profile } from '../types'
import { ALLERGEN_LABEL } from '../lib/labels'

export interface OrderCardContent {
  heading: string
  lines: string[]
  /** Restaurant-specific asks, only when opened from a restaurant. */
  notes: string[]
  thanks: string
}

/** Polite, discreet wording for showing a server. Tailored to the user's profile. */
export function orderCardContent(profile: Profile, dishes: Dish[] = []): OrderCardContent {
  const lines: string[] = []
  let heading: string

  if (profile.tolerance === 'celiac') {
    heading = 'I have celiac disease.'
    lines.push('Please use a clean surface, clean utensils and fresh gloves for my order.')
    lines.push(
      profile.needsDedicatedFryer
        ? 'Please do not cook my food in a shared fryer. A dedicated fryer only.'
        : 'Please do not use a shared fryer for my food.',
    )
    lines.push('No wheat, barley, rye, flour, breading, soy sauce or malt, including in sauces.')
    lines.push('Could you check with the kitchen before confirming my order?')
  } else if (profile.tolerance === 'sensitive') {
    heading = 'I need to eat gluten-free.'
    lines.push('No wheat, barley, rye, flour, breading or soy sauce, including in sauces.')
    lines.push('Clean utensils and a clean surface, please, where you can.')
    if (profile.needsDedicatedFryer) lines.push('I would like to avoid a shared fryer.')
  } else {
    heading = 'I’m eating gluten-free.'
    lines.push('Could you point me to what’s gluten-free, or what can be made without gluten?')
    lines.push('No wheat, flour, breading or soy sauce in mine, please.')
  }

  if (profile.needsSeparatePrep && profile.tolerance !== 'preference') {
    lines.push('A separate prep area, if you have one.')
  }
  if (profile.allergies.length > 0) {
    lines.push(`I also avoid: ${profile.allergies.map((a) => ALLERGEN_LABEL[a].toLowerCase()).join(', ')}.`)
  }

  const notes = dishes
    .filter((d) => d.gfStatus === 'can_be_gf' && d.modificationNote)
    .slice(0, 3)
    .map((d) => `${d.name}: ${d.modificationNote}`)

  return { heading, lines, notes, thanks: 'Thank you so much!' }
}
