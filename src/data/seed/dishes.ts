import type { Allergen, Dish, GFStatus } from '../../types'
import { safety } from './safety'

// SAMPLE DATA: invented dishes for fictional restaurants.
// Status codes: a = GF as served, m = can be made GF, n = not GF.

const STATUS: Record<'a' | 'm' | 'n', GFStatus> = {
  a: 'gf_as_served',
  m: 'can_be_gf',
  n: 'not_gf',
}

type Row = [
  name: string,
  status: 'a' | 'm' | 'n',
  note: string,
  fried?: boolean,
  allergens?: Allergen[],
  confirmed?: string,
]

const byRestaurant: Record<string, Row[]> = {
  r01: [
    ['Margherita pie', 'a', 'Whole kitchen is gluten-free (reported).', false, ['dairy']],
    ['Burrata & prosciutto pie', 'a', '', false, ['dairy']],
    ['Garlic knots', 'a', 'Baked in the same GF kitchen.', false, ['dairy']],
    ['Fried zeppole', 'a', 'Dedicated fryer (reported).', true, ['dairy']],
  ],
  r02: [
    ['Carne asada tacos (corn)', 'a', 'Corn tortillas. Confirm no flour tortillas on the same griddle.', false],
    ['Chips & guacamole', 'a', 'Chips come from a fryer used only for corn (reported).', true],
    ['Chorizo quesadilla', 'm', 'Ask for corn tortilla.', false, ['dairy']],
    ['Flour burrito', 'n', 'Flour tortilla.', false, ['dairy']],
  ],
  r03: [
    ['Sashimi plate', 'a', 'Skip the house soy. Ask for tamari.', false, ['soy']],
    ['Nigiri set', 'm', 'Ask for no soy sauce glaze and tamari on the side.', false, ['soy']],
    ['Tempura roll', 'n', 'Battered and fried.', true],
    ['Miso soup', 'm', 'Some miso contains barley. Ask which one is used.', false, ['soy']],
  ],
  r04: [
    ['Beef & broccoli', 'm', 'Sauce has soy. Ask if a cornstarch-only sauce is possible; staff may not know.', false, ['soy']],
    ['Hand-pulled noodles', 'n', 'Wheat noodles.', false],
    ['Steamed rice & greens', 'a', 'Plain steamed. Ask for no sauce.', false],
  ],
  r05: [
    ['GF cacio e pepe', 'a', 'Separate pot and strainer (reported).', false, ['dairy']],
    ['Grilled branzino', 'a', '', false],
    ['Tiramisu', 'n', 'Ladyfingers.', false, ['dairy']],
    ['GF olive oil cake', 'a', 'Dessert made GF in house.', false, ['nuts']],
  ],
  r06: [
    ['Smash burger on GF bun', 'm', 'Ask for GF bun and fresh gloves.', false, ['dairy']],
    ['Lettuce-wrap burger', 'a', 'Safest ask. Request a clean surface.', false],
    ['French fries', 'n', 'Shared fryer with breaded items.', true],
    ['Chopped salad', 'm', 'No croutons.', false, ['dairy']],
  ],
  r07: [
    ['Chana masala', 'a', 'Naturally GF. Confirm no flour thickener.', false],
    ['Tandoori chicken', 'a', '', false, ['dairy']],
    ['Samosas', 'n', 'Wheat pastry.', true],
    ['Basmati rice', 'a', '', false],
    ['Dal tadka', 'a', 'Ask that asafoetida (hing) is gluten-free; some brands are cut with wheat flour.', false],
  ],
  r08: [
    ['Buckwheat galette, ham & cheese', 'a', 'Galettes are 100% buckwheat (reported). Ask about griddle sharing.', false, ['dairy']],
    ['Crêpe with lemon & sugar', 'n', 'Wheat flour.', false, ['dairy']],
    ['Nicoise salad', 'a', '', false],
  ],
  r09: [
    ['Bulgogi', 'm', 'Marinade has soy sauce. Ask whether a tamari-based version is possible.', false, ['soy']],
    ['Galbi (unmarinated)', 'm', 'Ask for plain, salt only.', false],
    ['Steamed rice', 'a', '', false],
    ['Japchae', 'n', 'Sauce has soy.', false, ['soy']],
  ],
  r10: [
    ['Dry-aged ribeye', 'a', 'Ask for no marinade or seasoning blend.', false],
    ['Baked potato', 'a', '', false, ['dairy']],
    ['Creamed spinach', 'm', 'Ask if flour is in the roux.', false, ['dairy']],
    ['Onion rings', 'n', 'Breaded, shared fryer.', true],
  ],
  r11: [
    ['Grain bowl with grilled chicken', 'a', 'Choose rice base. Skip farro.', false],
    ['Kale Caesar', 'm', 'No croutons. Dressing contains anchovy.', false, ['dairy']],
    ['Quinoa power bowl', 'a', 'Labeled GF on the menu.', false, ['nuts']],
  ],
  r12: [
    ['Grilled octopus', 'a', '', false],
    ['Lamb souvlaki (no pita)', 'm', 'Ask for no pita, extra salad.', false],
    ['Spanakopita', 'n', 'Phyllo dough.', false, ['dairy']],
    ['Greek salad', 'a', '', false, ['dairy']],
  ],
  r13: [
    ['GF bagel with lox', 'm', 'Toasted in the same toaster as regular bagels. Ask them not to toast it.', false, ['dairy']],
    ['Lox on cucumber', 'a', 'Ask for a clean knife.', false, ['dairy']],
    ['Everything bagel', 'n', 'Wheat bagel.', false],
  ],
  r14: [
    ['Pad thai', 'm', 'Rice noodles but soy sauce in the sauce. Ask for tamari or a plain-sauce version.', false, ['soy', 'nuts']],
    ['Green curry', 'a', 'Check that no soy sauce goes in the curry base.', false],
    ['Spring rolls', 'n', 'Wheat wrappers.', true],
    ['Mango sticky rice', 'a', '', false],
  ],
  r15: [
    ['Chocolate layer cake', 'a', 'Fully gluten-free bakery (reported).', false, ['dairy']],
    ['Sandwich loaf', 'a', '', false, ['dairy']],
    ['Almond cookies', 'a', '', false, ['nuts']],
    ['Cinnamon bun', 'a', '', false, ['dairy']],
  ],
  r16: [
    ['Wings (naked, dry rub)', 'm', 'Fried in shared fryer. Ask for baked or grilled instead.', true],
    ['GF beer flight', 'a', 'Gluten-free beer on draft.', false],
    ['Beer-battered fish & chips', 'n', 'Beer batter.', true],
    ['House salad', 'a', '', false, ['dairy']],
  ],
  r17: [
    ['Pho bo', 'm', 'Broth is usually GF but hoisin and some noodles are not. Ask staff to confirm.', false],
    ['Rice-paper rolls', 'a', 'Peanut sauce may contain soy sauce. Ask first.', false, ['nuts']],
    ['Banh mi', 'n', 'Baguette.', false],
  ],
  r18: [
    ['Jackfruit tacos', 'a', 'Corn tortillas.', false, ['soy']],
    ['Crispy cauliflower bites', 'a', 'Rice-flour batter in a dedicated fryer (reported).', true],
    ['Cashew mac', 'm', 'GF pasta on request.', false, ['nuts']],
    ['Vegan brownie', 'a', '', false, ['nuts', 'soy']],
    ['Seitan wrap', 'n', 'Seitan is wheat gluten.', false, ['soy']],
  ],
  r19: [
    ['Raw oysters', 'a', '', false],
    ['Grilled branzino', 'a', 'Ask for no seasoning blend.', false],
    ['Fried calamari', 'n', 'Shared fryer.', true],
    ['Clam chowder', 'n', 'Flour roux.', false, ['dairy']],
    ['Shrimp cocktail', 'a', '', false],
  ],
  r20: [['Misir wot (lentils)', 'm', 'Injera is sometimes blended with wheat. Ask if it is 100% teff. Not yet confirmed.', false, [], '2026-02-01']],
}

export const dishes: Dish[] = Object.entries(byRestaurant).flatMap(([restaurantId, rows]) => {
  const fallbackDate = safety.find((s) => s.restaurantId === restaurantId)?.lastConfirmed ?? '2026-06-01'
  return rows.map(([name, status, note, fried = false, allergens = [], confirmed], i) => ({
    id: `${restaurantId}_d${i + 1}`,
    restaurantId,
    name,
    gfStatus: STATUS[status],
    modificationNote: note,
    fried,
    allergens,
    lastConfirmed: confirmed ?? fallbackDate,
    source: 'seed' as const,
  }))
})
