// Fetches a car image from Wikimedia Commons by make + model + year.
// manufacturer = Hebrew from Israeli gov API (e.g. "טויוטה")
// model        = English uppercase from Israeli gov API (e.g. "COROLLA")
// year         = number (e.g. 2011)
//
// Strategy:
//   1. Search Commons for "Make Model Year" — most accurate, year-specific
//   2. Search Commons for "Make Model" (no year) — fallback
//   3. Wikipedia page summary thumbnail — last resort (may be latest model)

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const BAD_IMAGE_PATTERNS = [/logo/i, /flag/i, /coat.*arm/i, /emblem/i, /badge/i, /portrait/i, /headshot/i, /schematic/i, /diagram/i];

// Hebrew manufacturer → English name used in Wikipedia/Commons
// Maps Hebrew manufacturer names (as returned by Israeli gov API) to English Wikipedia names.
// Includes common spelling variants and distributor suffixes stripped by resolveMfr().
const MFR_MAP = {
  // Toyota
  'טויוטה':     'Toyota',
  // Hyundai
  'יונדאי':     'Hyundai',
  // Kia
  'קיה':        'Kia',
  // Mazda — gov returns "מזדה" (no aleph) and "מזדה יפן"
  'מאזדה':      'Mazda',
  'מזדה':       'Mazda',
  // Honda
  'הונדה':      'Honda',
  // Nissan
  'ניסאן':      'Nissan',
  // Volkswagen
  'פולקסווגן':  'Volkswagen',
  'פולקסוואגן': 'Volkswagen',
  // Skoda
  'סקודה':      'Skoda',
  'שקודה':      'Skoda',
  // Chevrolet
  'שברולט':     'Chevrolet',
  // Ford
  'פורד':       'Ford',
  // Citroen
  'סיטרואן':    'Citroen',
  'סיטרואן':    'Citroen',
  // Peugeot
  "פיג'ו":      'Peugeot',
  'פיגו':       'Peugeot',
  // Renault
  'רנו':        'Renault',
  // Audi
  'אאודי':      'Audi',
  'אודי':       'Audi',
  // BMW
  'ב.מ.וו':     'BMW',
  'ב.מ.ו':      'BMW',
  'BMW':        'BMW',
  // Mercedes
  'מרצדס בנץ':  'Mercedes-Benz',
  'מרצדס':      'Mercedes-Benz',
  // Subaru
  'סובארו':     'Subaru',
  // Mitsubishi
  'מיצובישי':   'Mitsubishi',
  'מיצובישי':   'Mitsubishi',
  // SEAT
  'סיאט':       'SEAT',
  // Opel
  'אופל':       'Opel',
  // Volvo
  'וולוו':      'Volvo',
  // Jeep
  "ג'יפ":       'Jeep',
  'ג׳יפ':       'Jeep',
  // Land Rover
  'לנד רובר':   'Land Rover',
  // MG
  'mg':         'MG',
  'MG':         'MG',
  // Haval
  'חאבאל':      'Haval',
  // Chery
  "צ'רי":       'Chery',
  'צ׳רי':       'Chery',
  // BYD
  'בי.וואי.די': 'BYD',
  'BYD':        'BYD',
  // Tesla
  'טסלה':       'Tesla',
  // SsangYong
  'סאנגיונג':   'SsangYong',
  'סנגיונג':    'SsangYong',
  // Suzuki
  'סוזוקי':     'Suzuki',
  // Lexus
  'לקסוס':      'Lexus',
  // Infiniti
  'אינפיניטי':  'Infiniti',
  // Cadillac
  'קאדילק':     'Cadillac',
  // Porsche
  'פורשה':      'Porsche',
  // Alfa Romeo
  'אלפא רומיאו':'Alfa Romeo',
  'אלפא רומאו': 'Alfa Romeo',
  // Fiat
  'פיאט':       'Fiat',
  // Dacia
  'דאציה':      'Dacia',
  "דאצ'יה":     'Dacia',
  // Lancia
  'לנציה':      'Lancia',
  // Genesis
  'גנסיס':      'Genesis',
  "ג'נסיס":     'Genesis',
  // Saab
  'סאב':        'Saab',
  // Mini
  'מיני':       'Mini',
  // Isuzu
  'איסוזו':     'Isuzu',
  // Dodge
  'דודג':       'Dodge',
  "דודג'":      'Dodge',
  // Jeep (alternate)
  'ג׳יפ':      'Jeep',
};

// Model name clean-ups for search: uppercase gov value → display name for search
const MODEL_DISPLAY = {
  'RAV 4':          'RAV4',
  'LAND CRUISER':   'Land Cruiser',
  'YARIS CROSS':    'Yaris Cross',
  'COROLLA CROSS':  'Corolla Cross',
  'SANTA FE':       'Santa Fe',
  'IONIQ 5':        'Ioniq 5',
  'IONIQ 6':        'Ioniq 6',
  'GRAND CHEROKEE': 'Grand Cherokee',
  'ECLIPSE CROSS':  'Eclipse Cross',
  'DISCOVERY SPORT':'Discovery Sport',
  'RANGE ROVER':    'Range Rover',
  'MODEL 3':        'Model 3',
  'MODEL Y':        'Model Y',
  'MODEL S':        'Model S',
  'MODEL X':        'Model X',
  'EV6':            'EV6',
  'EV9':            'EV9',
  'ID.3':           'ID.3',
  'ID.4':           'ID.4',
  'E-TRON':         'e-tron',
  'Q4 E-TRON':      'Q4 e-tron',
  'CX-5':           'CX-5',
  'CX-3':           'CX-3',
  'CX-30':          'CX-30',
  'CX-60':          'CX-60',
  'MAZDA 3':        'Mazda3',
  'MAZDA 6':        'Mazda6',
  'MAZDA 2':        'Mazda2',
  'X-TRAIL':        'X-Trail',
  'HR-V':           'HR-V',
  'CR-V':           'CR-V',
  'T-ROC':          'T-Roc',
  'T-CROSS':        'T-Cross',
  'A CLASS':        'A-Class',
  'B CLASS':        'B-Class',
  'C CLASS':        'C-Class',
  'E CLASS':        'E-Class',
  'S CLASS':        'S-Class',
};

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function isGoodImage(url) {
  if (!url) return false;
  return !BAD_IMAGE_PATTERNS.some(p => p.test(url));
}

// Search Wikimedia Commons for an image file, return thumbnail URL
async function searchCommonsImage(query) {
  try {
    const params = new URLSearchParams({
      action:      'query',
      list:        'search',
      srsearch:    query,
      srnamespace: '6',       // File namespace
      srlimit:     '5',
      format:      'json',
      origin:      '*',
    });
    const searchRes = await fetch(`${COMMONS_API}?${params}`, {
      headers: { 'User-Agent': 'CarServiceTracker/1.0 (gal9amar@gmail.com)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData.query?.search || [];
    if (!results.length) return null;

    // Try each result until we get a good image
    for (const result of results) {
      const title = result.title; // e.g. "File:2011 Toyota Corolla.jpg"
      const infoParams = new URLSearchParams({
        action:   'query',
        titles:   title,
        prop:     'imageinfo',
        iiprop:   'url',
        iiurlwidth: '600',
        format:   'json',
        origin:   '*',
      });
      const infoRes = await fetch(`${COMMONS_API}?${infoParams}`, {
        headers: { 'User-Agent': 'CarServiceTracker/1.0 (gal9amar@gmail.com)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!infoRes.ok) continue;
      const infoData = await infoRes.json();
      const pages = Object.values(infoData.query?.pages || {});
      const thumbUrl = pages[0]?.imageinfo?.[0]?.thumburl || null;
      if (isGoodImage(thumbUrl)) return thumbUrl;
    }
    return null;
  } catch {
    return null;
  }
}

// Wikipedia page summary thumbnail (year-agnostic, last resort)
async function fetchWikiSummaryImage(pageTitle) {
  try {
    const res = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(pageTitle)}`, {
      headers: { 'User-Agent': 'CarServiceTracker/1.0 (gal9amar@gmail.com)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imgUrl = data.thumbnail?.source || null;
    return isGoodImage(imgUrl) ? imgUrl : null;
  } catch {
    return null;
  }
}

// Hebrew color → English color for Commons search
const COLOR_MAP = {
  'לבן':   'white',
  'שחור':  'black',
  'כסוף':  'silver',
  'אפור':  'gray',
  'אדום':  'red',
  'כחול':  'blue',
  'ירוק':  'green',
  'חום':   'brown',
  'בז':    'beige',
  'כתום':  'orange',
  'צהוב':  'yellow',
  'סגול':  'purple',
  'ורוד':  'pink',
  'זהב':   'gold',
  'בורדו': 'burgundy',
  'נייבי': 'navy',
};

/**
 * Fetch a car image, preferring year + color accurate photos from Wikimedia Commons.
 * @param {string} manufacturer - Hebrew (e.g. "טויוטה")
 * @param {string} model        - Uppercase English (e.g. "COROLLA", "SANTA FE")
 * @param {number} year         - e.g. 2011
 * @param {string} color        - Hebrew color (e.g. "לבן", "שחור") — optional
 */
// Resolve manufacturer to English, handling distributor suffixes like "יונדאי צ'כיה"
function resolveMfr(raw) {
  if (!raw) return 'Unknown';
  const trimmed = raw.trim();
  // Exact match first
  if (MFR_MAP[trimmed]) return MFR_MAP[trimmed];
  // Try each word prefix: "יונדאי צ'כיה" → try "יונדאי"
  const words = trimmed.split(/\s+/);
  for (let i = words.length - 1; i >= 1; i--) {
    const prefix = words.slice(0, i).join(' ');
    if (MFR_MAP[prefix]) return MFR_MAP[prefix];
  }
  // Fall back to title-cased raw value
  return toTitleCase(trimmed);
}

export async function fetchCarImage(manufacturer, model, year, color) {
  if (!manufacturer || !model) return null;

  const mfrEn    = resolveMfr(manufacturer);
  const modelUp  = (model || '').trim().toUpperCase();
  const modelDsp = MODEL_DISPLAY[modelUp] || toTitleCase(model.trim());
  const colorEn  = color ? (COLOR_MAP[color.trim()] || null) : null;

  // Build search queries in priority order (most specific first)
  const queries = [];

  if (year && colorEn) {
    queries.push(`${year} ${mfrEn} ${modelDsp} ${colorEn}`);
  }
  if (year) {
    queries.push(`${year} ${mfrEn} ${modelDsp}`);
    queries.push(`${year - 1} ${mfrEn} ${modelDsp}`);
    queries.push(`${year + 1} ${mfrEn} ${modelDsp}`);
  }
  if (colorEn) {
    queries.push(`${mfrEn} ${modelDsp} ${colorEn}`);
  }
  queries.push(`${mfrEn} ${modelDsp}`);
  // Fallback: try white if no color match found
  if (colorEn && colorEn !== 'white') {
    if (year) queries.push(`${year} ${mfrEn} ${modelDsp} white`);
    queries.push(`${mfrEn} ${modelDsp} white`);
  }

  for (const q of queries) {
    const img = await searchCommonsImage(q);
    if (img) return img;
  }

  // Last resort: Wikipedia page thumbnail (latest gen, but better than nothing)
  return fetchWikiSummaryImage(`${mfrEn} ${modelDsp}`);
}
