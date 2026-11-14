import type { Restaurant } from '../../types'

// SAMPLE DATA. Every restaurant here is fictional. Names, safety facts and
// dishes are invented to demo the app and must never be read as real info.
// Neighborhoods and coordinates are real NYC places so the map looks right.

type R = Omit<Restaurant, 'googlePlaceId' | 'sample'>

const rows: R[] = [
  { id: 'r01', name: 'Fieldstone Pizza (Sample)', neighborhood: 'Williamsburg', address: '100 Sample St, Brooklyn', lat: 40.7142, lng: -73.9612, cuisine: 'Pizza', price: 2, hours: { open: 12, close: 23 }, blurb: 'Wood-fired pies from an all gluten-free kitchen.', hasGfBeer: true, hasGfDesserts: true },
  { id: 'r02', name: 'Maíz y Fuego (Sample)', neighborhood: 'Bushwick', address: '210 Sample Ave, Brooklyn', lat: 40.7048, lng: -73.9226, cuisine: 'Mexican', price: 1, hours: { open: 11, close: 26 }, blurb: 'Corn-forward tacos and late-night tostadas.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r03', name: 'Sakura Counter (Sample)', neighborhood: 'East Village', address: '55 Sample Pl, Manhattan', lat: 40.7265, lng: -73.9815, cuisine: 'Japanese', price: 3, hours: { open: 17, close: 23 }, blurb: 'Omakase-style sushi counter with a small hot menu.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r04', name: 'Lucky Dragon Noodles (Sample)', neighborhood: 'Chinatown', address: '18 Sample Rd, Manhattan', lat: 40.7158, lng: -73.997, cuisine: 'Chinese', price: 1, hours: { open: 11, close: 22 }, blurb: 'Hand-pulled noodles and wok classics.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r05', name: 'Trattoria Bianca (Sample)', neighborhood: 'West Village', address: '72 Sample Ln, Manhattan', lat: 40.7336, lng: -74.0027, cuisine: 'Italian', price: 3, hours: { open: 17, close: 23 }, blurb: 'Candlelit pasta with a separate gluten-free pasta pot.', hasGfBeer: true, hasGfDesserts: true },
  { id: 'r06', name: 'Hudson Burger Co. (Sample)', neighborhood: "Hell's Kitchen", address: '440 Sample Way, Manhattan', lat: 40.7638, lng: -73.9918, cuisine: 'American', price: 2, hours: { open: 11, close: 24 }, blurb: 'Smash burgers, shakes and a gluten-free bun option.', hasGfBeer: true, hasGfDesserts: false },
  { id: 'r07', name: 'Saffron & Spice (Sample)', neighborhood: 'Jackson Heights', address: '37 Sample Blvd, Queens', lat: 40.7557, lng: -73.8831, cuisine: 'Indian', price: 2, hours: { open: 12, close: 22 }, blurb: 'Lentil-rich curries and tandoor grills.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r08', name: 'Café Lumière (Sample)', neighborhood: 'Park Slope', address: '9 Sample Ct, Brooklyn', lat: 40.6728, lng: -73.9777, cuisine: 'French', price: 2, hours: { open: 8, close: 17 }, blurb: 'Buckwheat galettes and café au lait.', hasGfBeer: false, hasGfDesserts: true },
  { id: 'r09', name: 'Seoul Table BBQ (Sample)', neighborhood: 'Koreatown', address: '31 Sample St, Manhattan', lat: 40.7473, lng: -73.9866, cuisine: 'Korean', price: 2, hours: { open: 12, close: 25 }, blurb: 'Tabletop grills, banchan and soju.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r10', name: 'Ember & Oak (Sample)', neighborhood: 'Midtown', address: '600 Sample Ave, Manhattan', lat: 40.7549, lng: -73.9743, cuisine: 'Steakhouse', price: 4, hours: { open: 17, close: 23 }, blurb: 'Dry-aged cuts and classic sides.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r11', name: 'Green Bowl (Sample)', neighborhood: 'Flatiron', address: '22 Sample Sq, Manhattan', lat: 40.7411, lng: -73.9897, cuisine: 'Salads & Bowls', price: 2, hours: { open: 10, close: 20 }, blurb: 'Build-your-own grain and green bowls, no fryer.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r12', name: 'Olive Branch (Sample)', neighborhood: 'Astoria', address: '28 Sample Dr, Queens', lat: 40.7644, lng: -73.9235, cuisine: 'Greek', price: 2, hours: { open: 11, close: 23 }, blurb: 'Charcoal-grilled meats, mezze and fresh fish.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r13', name: 'Bagel Alley (Sample)', neighborhood: 'Lower East Side', address: '5 Sample St, Manhattan', lat: 40.7185, lng: -73.9884, cuisine: 'Bagels & Deli', price: 1, hours: { open: 6, close: 16 }, blurb: 'Classic bagels, lox and a gluten-free bagel on request.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r14', name: 'Thai Orchid (Sample)', neighborhood: 'Greenpoint', address: '140 Sample Ave, Brooklyn', lat: 40.7303, lng: -73.9544, cuisine: 'Thai', price: 2, hours: { open: 12, close: 22 }, blurb: 'Rice noodles, curries and street-food snacks.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r15', name: 'Sweet Crumb Bakery (Sample)', neighborhood: 'Chelsea', address: '88 Sample St, Manhattan', lat: 40.7465, lng: -74.0014, cuisine: 'Bakery & Desserts', price: 2, hours: { open: 8, close: 19 }, blurb: 'A fully gluten-free bakery: cakes, cookies and sandwich bread.', hasGfBeer: false, hasGfDesserts: true },
  { id: 'r16', name: 'Brewhouse 41 (Sample)', neighborhood: 'Long Island City', address: '41 Sample Ave, Queens', lat: 40.7447, lng: -73.9485, cuisine: 'Gastropub', price: 2, hours: { open: 12, close: 26 }, blurb: 'Craft taps, wings and a gluten-free beer on draft.', hasGfBeer: true, hasGfDesserts: false },
  { id: 'r17', name: 'Pho Saigon (Sample)', neighborhood: 'Sunset Park', address: '60 Sample Rd, Brooklyn', lat: 40.6451, lng: -74.0124, cuisine: 'Vietnamese', price: 1, hours: { open: 10, close: 21 }, blurb: 'Slow-simmered pho and rice-paper rolls.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r18', name: 'Casa Verde Vegan (Sample)', neighborhood: 'Bed-Stuy', address: '320 Sample Blvd, Brooklyn', lat: 40.6846, lng: -73.9442, cuisine: 'Vegan', price: 2, hours: { open: 11, close: 22 }, blurb: 'Plant-based comfort food with a dedicated fryer.', hasGfBeer: true, hasGfDesserts: true },
  { id: 'r19', name: 'Harbor Oyster Bar (Sample)', neighborhood: 'Tribeca', address: '12 Sample Pl, Manhattan', lat: 40.7195, lng: -74.0089, cuisine: 'Seafood', price: 3, hours: { open: 16, close: 24 }, blurb: 'Raw bar, grilled fish and a short wine list.', hasGfBeer: false, hasGfDesserts: false },
  { id: 'r20', name: 'Injera House (Sample)', neighborhood: 'Harlem', address: '240 Sample Ave, Manhattan', lat: 40.8116, lng: -73.9465, cuisine: 'Ethiopian', price: 2, hours: { open: 12, close: 22 }, blurb: 'Shared platters on injera. Low data: help us fill this in.', hasGfBeer: false, hasGfDesserts: false },
]

export const restaurants: Restaurant[] = rows.map((r, i) => ({
  ...r,
  googlePlaceId: `sample_place_${String(i + 1).padStart(2, '0')}`,
  sample: true,
}))
