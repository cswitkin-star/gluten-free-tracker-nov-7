// All safety-sensitive wording lives here so it can be reviewed in one place.

export const DISCLAIMER_SHORT =
  'Info is reported by people and may be out of date. Always confirm with the restaurant.'

export const DISCLAIMER_LONG =
  'Gluten-free information in this app is reported by users and sample data, and can be wrong or out of date. ' +
  'Nothing here is a guarantee of safety. Cross-contact can happen anywhere. ' +
  'If you have celiac disease or a serious reaction history, confirm with the restaurant every time and follow your doctor’s advice.'

export const SAMPLE_DATA_NOTICE =
  'Sample data: these restaurants, dishes and reviews are invented for a demo.'

/** Phrases that overpromise. A test fails if any user-facing copy contains one. */
export const BANNED_PHRASES = [
  'celiac safe',
  'celiac-safe',
  '100% safe',
  'guaranteed safe',
  'completely safe',
  'is safe for celiacs',
  'no risk',
]
