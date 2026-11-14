import type { Review } from '../../types'

// SAMPLE DATA: invented reviews by invented people.

type Row = [
  restaurantId: string,
  author: string,
  tolerance: Review['reviewerTolerance'],
  safety: Review['safetyRating'],
  taste: Review['tasteRating'],
  text: string,
  date: string,
]

const rows: Row[] = [
  ['r01', 'Sam', 'celiac', 5, 4, 'Whole menu is GF so I could relax and just order. Crust was great.', '2026-10-20'],
  ['r01', 'Jo', 'preference', null, 5, 'Best pizza I have had, GF or not.', '2026-09-30'],
  ['r02', 'Priya', 'sensitive', 4, 5, 'Corn tacos were excellent. Staff checked on the chips fryer when I asked.', '2026-09-10'],
  ['r03', 'Dana', 'celiac', 2, 4, 'Great fish, but they were unsure about the miso and the soy. I stuck to sashimi.', '2026-07-30'],
  ['r05', 'Lee', 'celiac', 5, 5, 'They brought the GF pasta in a separate pot without me asking twice.', '2026-10-30'],
  ['r05', 'Maya P.', 'preference', null, 5, 'The GF cacio e pepe is the real thing. Date-night worthy.', '2026-10-02'],
  ['r06', 'Chris', 'sensitive', 3, 4, 'Lettuce-wrap burger was good. Fries are shared fryer, so I skipped them.', '2026-09-25'],
  ['r07', 'Anika', 'sensitive', 4, 5, 'Most of the menu works. Confirm the dal has no hing with wheat.', '2026-09-18'],
  ['r11', 'Rae', 'celiac', 4, 4, 'Staff knew the question before I finished asking. Bowls are a little bland.', '2026-11-05'],
  ['r15', 'Tom', 'celiac', 5, 4, 'I cried a little at the cinnamon bun. Whole shop is GF.', '2026-11-08'],
  ['r16', 'Jess', 'preference', null, 3, 'GF beer on tap is a nice touch. Food is fine.', '2026-08-29'],
  ['r17', 'Kim', 'celiac', 2, 4, 'Pho was tasty but staff were not sure about the hoisin or the noodles. I felt off after.', '2026-03-10'],
  ['r18', 'Noor', 'sensitive', 5, 5, 'Dedicated fryer, vegan and fun. My new Friday spot.', '2026-10-09'],
  ['r19', 'Ben', 'celiac', 4, 4, 'Raw bar is simple and safe-feeling. Staff were careful with the fried items.', '2026-10-15'],
]

export const reviews: Review[] = rows.map(
  ([restaurantId, author, reviewerTolerance, safetyRating, tasteRating, text, date], i) => ({
    id: `rev_seed_${i + 1}`,
    restaurantId,
    author,
    reviewerTolerance,
    safetyRating,
    tasteRating,
    text,
    date,
    sample: true,
  }),
)
