// Fetches a car image URL from Wikipedia by manufacturer + model.
// manufacturer comes from Israeli gov API as Hebrew (e.g. "טויוטה", "יונדאי")
// model comes from Israeli gov API as English uppercase (e.g. "COROLLA", "TUCSON")

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';

// Patterns that indicate a non-car image (logo, flag, person, etc.)
const BAD_IMAGE_PATTERNS = [/logo/i, /flag/i, /coat.*arm/i, /emblem/i, /badge/i, /portrait/i, /headshot/i];

// Hebrew manufacturer → English Wikipedia name
const MFR_MAP = {
  'טויוטה':     'Toyota',
  'יונדאי':     'Hyundai',
  'קיה':        'Kia',
  'מאזדה':      'Mazda',
  'הונדה':      'Honda',
  'ניסאן':      'Nissan',
  'פולקסווגן':  'Volkswagen',
  'סקודה':      'Skoda',
  'שברולט':     'Chevrolet',
  'פורד':       'Ford',
  'סיטרואן':    'Citroen',
  "פיג'ו":      'Peugeot',
  'רנו':        'Renault',
  'אאודי':      'Audi',
  'ב.מ.וו':     'BMW',
  'מרצדס בנץ':  'Mercedes-Benz',
  'מרצדס':      'Mercedes-Benz',
  'סובארו':     'Subaru',
  'מיצובישי':   'Mitsubishi',
  'סיאט':       'SEAT',
  'אופל':       'Opel',
  'וולוו':      'Volvo',
  "ג'יפ":       'Jeep',
  'לנד רובר':   'Land Rover',
  'mg':         'MG (car)',
  'MG':         'MG (car)',
  'חאבאל':      'Haval',
  "צ'רי":       'Chery',
  'בי.וואי.די': 'BYD Auto',
  'BYD':        'BYD Auto',
  'טסלה':       'Tesla, Inc.',
  'סאנגיונג':   'SsangYong',
  'סוזוקי':     'Suzuki',
  'לקסוס':      'Lexus',
  'אינפיניטי':  'Infiniti',
  'אקורה':      'Acura',
  'לינקולן':    'Lincoln (automobile)',
  'קאדילק':     'Cadillac',
  'פורשה':      'Porsche',
  'אלפא רומיאו':'Alfa Romeo',
  'אלפא רומאו': 'Alfa Romeo',
  'פיאט':       'Fiat',
  'דאציה':      'Dacia',
  "דאצ'יה":     'Dacia',
  'לנציה':      'Lancia',
  'סיאט':       'SEAT',
  'ג\'נסיס':    'Genesis (automobile)',
  'גנסיס':      'Genesis (automobile)',
};

// Model name overrides — maps uppercase gov model → Wikipedia page title
// Only needed when Wikipedia page has a non-obvious name
const MODEL_OVERRIDES = {
  'JAZZ':          'Honda Jazz',
  'HR-V':          'Honda HR-V',
  'CR-V':          'Honda CR-V',
  'CR-Z':          'Honda CR-Z',
  'PILOT':         'Honda Pilot',
  'RIDGELINE':     'Honda Ridgeline',
  'LAND CRUISER':  'Toyota Land Cruiser',
  'LAND CRUISER PRADO': 'Toyota Land Cruiser Prado',
  'RAV 4':         'Toyota RAV4',
  'RAV4':          'Toyota RAV4',
  'C-HR':          'Toyota C-HR',
  'YARIS CROSS':   'Toyota Yaris Cross',
  'COROLLA CROSS': 'Toyota Corolla Cross',
  'SANTA FE':      'Hyundai Santa Fe',
  'GRAND SANTA FE':'Hyundai Santa Fe',
  'STARIA':        'Hyundai Staria',
  'IONIQ 5':       'Hyundai Ioniq 5',
  'IONIQ 6':       'Hyundai Ioniq 6',
  'EV6':           'Kia EV6',
  'EV9':           'Kia EV9',
  'SPORTAGE':      'Kia Sportage',
  'SORENTO':       'Kia Sorento',
  'NIRO':          'Kia Niro',
  'CX-5':          'Mazda CX-5',
  'CX-3':          'Mazda CX-3',
  'CX-30':         'Mazda CX-30',
  'CX-60':         'Mazda CX-60',
  'MAZDA 3':       'Mazda3',
  'MAZDA 6':       'Mazda6',
  'MAZDA 2':       'Mazda2',
  'QASHQAI':       'Nissan Qashqai',
  'X-TRAIL':       'Nissan X-Trail',
  'MICRA':         'Nissan Micra',
  'LEAF':          'Nissan Leaf',
  'ARIYA':         'Nissan Ariya',
  'JUKE':          'Nissan Juke',
  'T-ROC':         'Volkswagen T-Roc',
  'T-CROSS':       'Volkswagen T-Cross',
  'ID.3':          'Volkswagen ID.3',
  'ID.4':          'Volkswagen ID.4',
  'TIGUAN':        'Volkswagen Tiguan',
  'TOUAREG':       'Volkswagen Touareg',
  'TOURAN':        'Volkswagen Touran',
  'CARAVELLE':     'Volkswagen Caravelle',
  'TRANSPORTER':   'Volkswagen Transporter',
  'OCTAVIA':       'Skoda Octavia',
  'KAROQ':         'Skoda Karoq',
  'KODIAQ':        'Skoda Kodiaq',
  'SUPERB':        'Skoda Superb',
  'FABIA':         'Skoda Fabia',
  'SCALA':         'Skoda Scala',
  'KAMIQ':         'Skoda Kamiq',
  'GLA':           'Mercedes-Benz GLA',
  'GLB':           'Mercedes-Benz GLB',
  'GLC':           'Mercedes-Benz GLC',
  'GLE':           'Mercedes-Benz GLE',
  'GLS':           'Mercedes-Benz GLS',
  'EQA':           'Mercedes-Benz EQA',
  'EQB':           'Mercedes-Benz EQB',
  'EQC':           'Mercedes-Benz EQC',
  'A CLASS':       'Mercedes-Benz A-Class',
  'B CLASS':       'Mercedes-Benz B-Class',
  'C CLASS':       'Mercedes-Benz C-Class',
  'E CLASS':       'Mercedes-Benz E-Class',
  'S CLASS':       'Mercedes-Benz S-Class',
  'X1':            'BMW X1',
  'X2':            'BMW X2',
  'X3':            'BMW X3',
  'X4':            'BMW X4',
  'X5':            'BMW X5',
  'X6':            'BMW X6',
  'X7':            'BMW X7',
  'Q2':            'Audi Q2',
  'Q3':            'Audi Q3',
  'Q4 E-TRON':     'Audi Q4 e-tron',
  'Q5':            'Audi Q5',
  'Q7':            'Audi Q7',
  'Q8':            'Audi Q8',
  'FORESTER':      'Subaru Forester',
  'OUTBACK':       'Subaru Outback',
  'IMPREZA':       'Subaru Impreza',
  'XV':            'Subaru XV',
  'ECLIPSE CROSS': 'Mitsubishi Eclipse Cross',
  'OUTLANDER':     'Mitsubishi Outlander',
  'ASX':           'Mitsubishi ASX',
  'PEUGEOT 208':   'Peugeot 208',
  'PEUGEOT 2008':  'Peugeot 2008',
  'PEUGEOT 308':   'Peugeot 308',
  'PEUGEOT 3008':  'Peugeot 3008',
  'PEUGEOT 5008':  'Peugeot 5008',
  'C3':            'Citroën C3',
  'C3 AIRCROSS':   'Citroën C3 Aircross',
  'C4':            'Citroën C4',
  'C5 AIRCROSS':   'Citroën C5 Aircross',
  'MEGANE':        'Renault Mégane',
  'KADJAR':        'Renault Kadjar',
  'CAPTUR':        'Renault Captur',
  'DUSTER':        'Dacia Duster',
  'SANDERO':       'Dacia Sandero',
  'LOGAN':         'Dacia Logan',
  'GRANDLAND':     'Opel Grandland',
  'MOKKA':         'Opel Mokka',
  'CROSSLAND':     'Opel Crossland',
  'TRAILBLAZER':   'Chevrolet Trailblazer',
  'EQUINOX':       'Chevrolet Equinox',
  'TRAVERSE':      'Chevrolet Traverse',
  'EXPLORER':      'Ford Explorer',
  'MUSTANG':       'Ford Mustang',
  'RANGER':        'Ford Ranger',
  'BRONCO':        'Ford Bronco',
  'PUMA':          'Ford Puma',
  'KUGA':          'Ford Kuga',
  'ECOSPORT':      'Ford EcoSport',
  'WRANGLER':      'Jeep Wrangler',
  'CHEROKEE':      'Jeep Cherokee',
  'GRAND CHEROKEE':'Jeep Grand Cherokee',
  'RENEGADE':      'Jeep Renegade',
  'COMPASS':       'Jeep Compass',
  'DEFENDER':      'Land Rover Defender',
  'DISCOVERY':     'Land Rover Discovery',
  'DISCOVERY SPORT':'Land Rover Discovery Sport',
  'RANGE ROVER':   'Range Rover',
  'RANGE ROVER SPORT': 'Range Rover Sport',
  'RANGE ROVER EVOQUE': 'Range Rover Evoque',
  'RANGE ROVER VELAR': 'Range Rover Velar',
  'GIULIA':        'Alfa Romeo Giulia',
  'STELVIO':       'Alfa Romeo Stelvio',
  'TONALE':        'Alfa Romeo Tonale',
  '159':           'Alfa Romeo 159',
  '147':           'Alfa Romeo 147',
  '156':           'Alfa Romeo 156',
  'ENYAQ':         'Skoda Enyaq',
  'VOLVO XC40':    'Volvo XC40',
  'VOLVO XC60':    'Volvo XC60',
  'VOLVO XC90':    'Volvo XC90',
  'XC40':          'Volvo XC40',
  'XC60':          'Volvo XC60',
  'XC90':          'Volvo XC90',
  'V60':           'Volvo V60',
  'S60':           'Volvo S60',
  'S90':           'Volvo S90',
  'ZS':            'MG ZS',
  'MG ZS':         'MG ZS',
  'MG HS':         'MG HS',
  'HS':            'MG HS',
  'ATTO 3':        'BYD Atto 3',
  'SEAL':          'BYD Seal',
  'DOLPHIN':       'BYD Dolphin',
  'MODEL 3':       'Tesla Model 3',
  'MODEL Y':       'Tesla Model Y',
  'MODEL S':       'Tesla Model S',
  'MODEL X':       'Tesla Model X',
};

// Title-case a string: "COROLLA" → "Corolla", "LAND CRUISER" → "Land Cruiser"
function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function isGoodImage(url) {
  if (!url) return false;
  return !BAD_IMAGE_PATTERNS.some(p => p.test(url));
}

async function fetchWikiImage(pageTitle) {
  try {
    const url = `${WIKIPEDIA_API}/${encodeURIComponent(pageTitle)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CarServiceTracker/1.0 (gal9amar@gmail.com)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Prefer thumbnail (faster, right size), fall back to original
    const imgUrl = data.thumbnail?.source || data.originalimage?.source || null;
    return isGoodImage(imgUrl) ? imgUrl : null;
  } catch {
    return null;
  }
}

/**
 * Returns a car image URL for the given vehicle, or null if not found.
 * @param {string} manufacturer - from Israeli gov API, Hebrew (e.g. "טויוטה")
 * @param {string} model        - from Israeli gov API, English uppercase (e.g. "COROLLA")
 */
export async function fetchCarImage(manufacturer, model) {
  if (!manufacturer || !model) return null;

  const mfrEn  = MFR_MAP[manufacturer?.trim()] || toTitleCase(manufacturer || '');
  const modelUp = (model || '').trim().toUpperCase();

  // 1. Check direct model override (most specific)
  if (MODEL_OVERRIDES[modelUp]) {
    const img = await fetchWikiImage(MODEL_OVERRIDES[modelUp]);
    if (img) return img;
  }

  // 2. Try "Manufacturer_Model" with title-cased model
  const modelTitle = toTitleCase(model.trim());
  const attempts = [
    `${mfrEn} ${modelTitle}`,
    `${mfrEn}_${modelTitle}`,
    modelTitle,                // model alone (e.g. "Corolla")
  ];

  for (const title of attempts) {
    const img = await fetchWikiImage(title);
    if (img) return img;
  }

  return null;
}
