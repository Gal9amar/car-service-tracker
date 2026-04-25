// Fetches a car image URL from Wikipedia by manufacturer + model.
// Falls back to null if not found or image looks wrong (logo, person, etc.).

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';

// Known bad image patterns (logos, flags, people)
const BAD_IMAGE_PATTERNS = [
  /logo/i, /flag/i, /coat.*arms/i, /emblem/i, /badge/i,
  /person/i, /portrait/i, /headshot/i,
];

// Normalize manufacturer names to Wikipedia page titles
const MANUFACTURER_MAP = {
  'טויוטה':    'Toyota',
  'toyota':    'Toyota',
  'יונדאי':    'Hyundai',
  'hyundai':   'Hyundai',
  'קיה':       'Kia',
  'kia':       'Kia',
  'מאזדה':     'Mazda',
  'mazda':     'Mazda',
  'הונדה':     'Honda',
  'honda':     'Honda',
  'ניסאן':     'Nissan',
  'nissan':    'Nissan',
  'פולקסווגן': 'Volkswagen',
  'volkswagen':'Volkswagen',
  'vw':        'Volkswagen',
  'סקודה':     'Skoda',
  'skoda':     'Skoda',
  'שברולט':    'Chevrolet',
  'chevrolet': 'Chevrolet',
  'פורד':      'Ford',
  'ford':      'Ford',
  'סיטרואן':   'Citroën',
  'citroen':   'Citroen',
  'citroën':   'Citroën',
  'פיג\'ו':    'Peugeot',
  'peugeot':   'Peugeot',
  'רנו':       'Renault',
  'renault':   'Renault',
  'אאודי':     'Audi',
  'audi':      'Audi',
  'ב.מ.וו':    'BMW',
  'bmw':       'BMW',
  'מרצדס':     'Mercedes-Benz',
  'mercedes':  'Mercedes-Benz',
  'סובארו':    'Subaru',
  'subaru':    'Subaru',
  'מיצובישי':  'Mitsubishi',
  'mitsubishi':'Mitsubishi',
  'סיאט':      'SEAT',
  'seat':      'SEAT',
  'אופל':      'Opel',
  'opel':      'Opel',
  'וולוו':     'Volvo',
  'volvo':     'Volvo',
  'ג\'יפ':     'Jeep',
  'jeep':      'Jeep',
  'לנד רובר':  'Land_Rover',
  'land rover':'Land_Rover',
  'mg':        'MG_(car)',
  'חאבאל':     'Haval',
  'haval':     'Haval',
  'צ\'רי':     'Chery',
  'chery':     'Chery',
  'גיאומטריק': 'Geometry_(car)',
  'בי.וואי.די':'BYD_Auto',
  'byd':       'BYD_Auto',
  'טסלה':      'Tesla,_Inc.',
  'tesla':     'Tesla,_Inc.',
  'שברולה':    'Chevrolet',
  'לנציה':     'Lancia',
  'lancia':    'Lancia',
  'אלפא רומאו':'Alfa_Romeo',
  'alfa romeo':'Alfa_Romeo',
  'פיאט':      'Fiat',
  'fiat':      'Fiat',
  'דאצ\'יה':   'Dacia',
  'dacia':     'Dacia',
  'סאנגיונג':  'SsangYong',
  'ssangyong': 'SsangYong',
  'סוזוקי':    'Suzuki',
  'suzuki':    'Suzuki',
  'לקסוס':     'Lexus',
  'lexus':     'Lexus',
  'אינפיניטי': 'Infiniti',
  'infiniti':  'Infiniti',
  'אקורה':     'Acura',
  'acura':     'Acura',
  'לינקולן':   'Lincoln_(car)',
  'lincoln':   'Lincoln_(car)',
  'קאדילק':    'Cadillac',
  'cadillac':  'Cadillac',
  'פורשה':     'Porsche',
  'porsche':   'Porsche',
  'למבורגיני': 'Lamborghini',
  'lamborghini':'Lamborghini',
  'פרארי':     'Ferrari',
  'ferrari':   'Ferrari',
  'מקלארן':    'McLaren',
  'mclaren':   'McLaren',
};

// Normalize model names
const MODEL_MAP = {
  'קורולה':    'Corolla',
  'קאמרי':     'Camry',
  'C-HR':      'C-HR',
  'RAV4':      'RAV4',
  'יאריס':     'Yaris',
  'אוריס':     'Auris',
  'פריוס':     'Prius',
  'לנד קרוזר': 'Land_Cruiser',
  'היילקס':    'Hilux',
  'טוקסון':    'Tucson',
  'סנטה פה':   'Santa_Fe',
  'i20':       'i20',
  'i30':       'i30',
  'i35':       'i35',
  'i40':       'i40',
  'קונה':      'Kona',
  'אלנטרה':    'Elantra',
  'אקסנט':     'Accent',
  'ספורטאג':   'Sportage',
  'סורנטו':    'Sorento',
  'סטוניק':    'Stonic',
  'ריו':       'Rio',
  'פיקנטו':    'Picanto',
  'CX-5':      'CX-5',
  'CX-3':      'CX-3',
  'CX-30':     'CX-30',
  'מאזדה 3':   'Mazda3',
  'מאזדה 6':   'Mazda6',
  'סיוויק':    'Civic',
  'אקורד':     'Accord',
  'ג\'אז':     'Jazz_(automobile)',
  'HR-V':      'Honda_HR-V',
  'CR-V':      'Honda_CR-V',
  'מיקרה':     'Micra',
  'קאשקאי':    'Qashqai',
  'ג\'וק':     'Juke',
  'X-Trail':   'X-Trail',
  'גולף':      'Golf',
  'פולו':      'Polo',
  'פאסאט':     'Passat',
  'טיגואן':    'Tiguan',
  'T-ROC':     'Volkswagen_T-Roc',
  'אוקטביה':   'Octavia',
  'פאביה':     'Fabia',
  'קודיאק':    'Kodiaq',
  'קאמיק':     'Kamiq',
  'סקאלה':     'Scala',
};

function normalizeManufacturer(raw) {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return MANUFACTURER_MAP[key] || MANUFACTURER_MAP[raw.trim()] || raw.trim().replace(/\s+/g, '_');
}

function normalizeModel(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  return MODEL_MAP[trimmed] || trimmed.replace(/\s+/g, '_');
}

function isGoodImage(imageUrl) {
  if (!imageUrl) return false;
  return !BAD_IMAGE_PATTERNS.some(pat => pat.test(imageUrl));
}

async function fetchWikiImage(pageTitle) {
  try {
    const url = `${WIKIPEDIA_API}/${encodeURIComponent(pageTitle)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CarServiceTracker/1.0 (gal9amar@gmail.com)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imgUrl = data.thumbnail?.source || data.originalimage?.source || null;
    return isGoodImage(imgUrl) ? imgUrl : null;
  } catch {
    return null;
  }
}

/**
 * Returns a car image URL for the given vehicle, or null if not found.
 * Tries multiple Wikipedia page title combinations.
 */
export async function fetchCarImage(manufacturer, model) {
  if (!manufacturer || !model) return null;

  const mfr   = normalizeManufacturer(manufacturer);
  const mdl   = normalizeModel(model);

  // Priority order of title attempts
  const attempts = [
    `${mfr}_${mdl}`,
    `${mfr} ${mdl}`,
    mdl.length > 2 ? mdl : null,      // model alone (e.g. "Corolla")
    mfr,                               // manufacturer alone as last resort — likely logo, will fail isGoodImage
  ].filter(Boolean);

  for (const title of attempts) {
    const img = await fetchWikiImage(title);
    if (img) return img;
  }

  return null;
}
