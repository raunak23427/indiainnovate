/**
 * Booth Allocation Engine
 * Assigns a booth to a user based on pincode, area keyword, or voter ID lookup.
 * Priority: voter DB lookup → pincode match → area keyword match → random fallback
 */

const booths = require('./booths.json');

// ── Pre-build lookup maps for fast matching ────────────────────────────────────

// Pincode → list of booths
const pincodeMap = {};
for (const booth of booths) {
  for (const pin of booth.pincodes) {
    if (!pincodeMap[pin]) pincodeMap[pin] = [];
    pincodeMap[pin].push(booth);
  }
}

// Area name (lowercase) → list of booths
const areaMap = {};
for (const booth of booths) {
  const key = booth.area.toLowerCase();
  if (!areaMap[key]) areaMap[key] = [];
  areaMap[key].push(booth);
}

// Area aliases / keywords that map to canonical area names
const AREA_ALIASES = {
  'dwarka':         'dwarka',
  'rohini':         'rohini',
  'saket':          'saket',
  'laxmi nagar':    'laxmi nagar',
  'laxminagar':     'laxmi nagar',
  'janakpuri':      'janakpuri',
  'pitampura':      'pitampura',
  'karol bagh':     'karol bagh',
  'karolbagh':      'karol bagh',
  'uttam nagar':    'uttam nagar',
  'uttamnagar':     'uttam nagar',
  'govindpuri':     'govindpuri',
  'mayur vihar':    'mayur vihar',
  'mayurvihar':     'mayur vihar',
  'preet vihar':    'preet vihar',
  'preevihar':      'preet vihar',
  'shahdara':       'shahdara',
  'vikaspuri':      'vikaspuri',
  'narela':         'narela',
  'mustafabad':     'mustafabad',
  'patel nagar':    'patel nagar',
  'patelnagar':     'patel nagar',
  'vasant kunj':    'vasant kunj',
  'vasantkunj':     'vasant kunj',
  'tilak nagar':    'tilak nagar',
  'tilaknagar':     'tilak nagar',
  'model town':     'model town',
  'modeltown':      'model town',
  'chandni chowk':  'chandni chowk',
  'chandnichowk':   'chandni chowk',
  'paharganj':      'paharganj',
  'patparganj':     'patparganj',
  'hari nagar':     'hari nagar',
  'harinagar':      'hari nagar',
  // Common abbreviations / misspellings
  'dw':             'dwarka',
  'roh':            'rohini',
  'jnk':            'janakpuri',
  'kbagh':          'karol bagh',
  'mvh':            'mayur vihar',
  'vkunj':          'vasant kunj',
};

/**
 * Pick a random booth from a list.
 */
function pickRandom(boothList) {
  return boothList[Math.floor(Math.random() * boothList.length)];
}

/**
 * Attempt to extract a pincode (6-digit number) from a string.
 */
function extractPincode(text) {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

/**
 * Attempt to find an area name in free-form address text.
 * Returns canonical area name or null.
 */
function extractArea(addressText) {
  const lower = addressText.toLowerCase();
  // Try longest aliases first to avoid partial matches
  const sortedAliases = Object.keys(AREA_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (lower.includes(alias)) {
      return AREA_ALIASES[alias];
    }
  }
  return null;
}

/**
 * Main allocation function.
 * @param {Object} opts
 * @param {string} [opts.pincode]  - 6-digit pincode
 * @param {string} [opts.address]  - free-form address
 * @param {string} [opts.area]     - explicit area name
 * @returns {{ booth_id, booth_name, area, ward_number } | null}
 */
function allocateBooth({ pincode, address = '', area = '' } = {}) {
  // 1. Pincode match (most precise)
  const pin = pincode || extractPincode(address);
  if (pin && pincodeMap[pin]) {
    return pickRandom(pincodeMap[pin]);
  }

  // 2. Explicit area provided
  if (area) {
    const canonicalArea = AREA_ALIASES[area.toLowerCase()] || area.toLowerCase();
    const matches = areaMap[canonicalArea];
    if (matches && matches.length > 0) return pickRandom(matches);
  }

  // 3. Area extracted from address string
  const detectedArea = extractArea(address);
  if (detectedArea && areaMap[detectedArea]) {
    return pickRandom(areaMap[detectedArea]);
  }

  // 4. Fallback: completely random from all booths
  return pickRandom(booths);
}

/**
 * Get all booths (for admin/filter UI)
 */
function getAllBooths() {
  return booths;
}

/**
 * Get booths for a specific area
 */
function getBoothsByArea(area) {
  const key = (AREA_ALIASES[area.toLowerCase()] || area.toLowerCase());
  return areaMap[key] || [];
}

/**
 * Get a booth by ID
 */
function getBoothById(boothId) {
  return booths.find(b => b.booth_id === boothId) || null;
}

/**
 * Get sorted unique areas list
 */
function getAllAreas() {
  return [...new Set(booths.map(b => b.area))].sort();
}

module.exports = { allocateBooth, getAllBooths, getBoothsByArea, getBoothById, getAllAreas };
