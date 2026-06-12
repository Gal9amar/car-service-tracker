import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { lookupVehicle } from '../services/vehicleLookup.js';
import { sendEmail, buildNewVehicleEmailHtml } from '../services/emailService.js';
import { fetchCarImage } from '../services/carImageService.js';

const router = Router();
router.use(authenticate);

// ── helpers ───────────────────────────────────────────────────────────────
function parseVehicle(v) {
  let ownershipHistory = [];
  let recalls = [];
  try { ownershipHistory = v.ownershipHistory ? JSON.parse(v.ownershipHistory) : []; } catch {}
  try { recalls          = v.recalls          ? JSON.parse(v.recalls)          : []; } catch {}
  return { ...v, ownershipHistory, recalls };
}

// GET /api/vehicles/lookup/:plate
router.get('/lookup/:plate', async (req, res, next) => {
  try {
    const result = await lookupVehicle(req.params.plate);
    if (!result) return res.status(404).json({ error: 'Vehicle not found in government database.' });
    res.json({ vehicle: result });
  } catch (err) { next(err); }
});

// GET /api/vehicles
router.get('/', async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { services: true, expenses: true } },
        reminders: {
          where: { isActive: true, dueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { dueDate: 'asc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ vehicles: vehicles.map(parseVehicle) });
  } catch (err) { next(err); }
});

// POST /api/vehicles
const boolOpt  = z.boolean().optional();
const intOpt   = z.number().int().optional().nullable();
const floatOpt = z.number().optional().nullable();
const strOpt   = z.string().optional().nullable();

const createVehicleSchema = z.object({
  // User
  nickname:       strOpt,
  currentMileage: intOpt,
  // Main
  licensePlate:     z.string().min(5).max(10),
  manufacturer:     z.string().min(1),
  manufacturerCode: intOpt,
  model:            z.string().min(1),
  modelCode:        strOpt,
  modelId:          intOpt,
  vehicleType:      strOpt,
  year:             z.number().int().min(1900).max(2030),
  color:            strOpt,
  colorCode:        intOpt,
  fuelType:         strOpt,
  engineModel:      strOpt,
  trim:             strOpt,
  safetyRating:     strOpt,
  pollutionLevel:   intOpt,
  vin:              strOpt,
  frontTire:        strOpt,
  rearTire:         strOpt,
  lastTest:         strOpt,
  testExpiry:       strOpt,
  ownership:        strOpt,
  registrationNote: strOpt,
  firstRegistered:  strOpt,
  // Technical
  engineNumber:       strOpt,
  testKm:             intOpt,
  structureChange:    boolOpt,
  hasGrapam:          boolOpt,
  colorChange:        boolOpt,
  tireChange:         boolOpt,
  firstRegisteredDate: strOpt,
  origin:             strOpt,
  // WLTP
  horsePower:           intOpt,
  engineCC:             intOpt,
  weight:               intOpt,
  doors:                intOpt,
  seats:                intOpt,
  bodyType:             strOpt,
  driveType:            strOpt,
  transmission:         strOpt,
  standardType:         strOpt,
  towingWithBrakes:     intOpt,
  towingWithoutBrakes:  intOpt,
  airbags:              intOpt,
  electricWindows:      intOpt,
  hasAC:                boolOpt,
  hasABS:               boolOpt,
  hasPowerSteering:     boolOpt,
  hasStabControl:       boolOpt,
  hasSunroof:           boolOpt,
  hasAlloyWheels:       boolOpt,
  hasTrunkRack:         boolOpt,
  co2:                  floatOpt,
  co2City:              floatOpt,
  co2Highway:           floatOpt,
  nox:                  floatOpt,
  co:                   floatOpt,
  greenScore:           intOpt,
  hasLaneDeparture:     boolOpt,
  hasForwardWarning:    boolOpt,
  hasBlindSpot:         boolOpt,
  hasAdaptiveCruise:    boolOpt,
  hasPedestrianDetect:  boolOpt,
  hasAutoEmergencyBrake: boolOpt,
  hasRearCamera:        boolOpt,
  hasTirePressure:      boolOpt,
  hasFatigueAlert:      boolOpt,
  safetyScore:          floatOpt,
  hasAutoHighBeam:      boolOpt,
  hasSpeedLimiter:      boolOpt,
  hasAlcoLock:          boolOpt,
  // JSON
  ownershipHistory: z.array(z.any()).optional().nullable(),
  recalls:          z.array(z.any()).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const d = createVehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        nickname:       d.nickname,
        currentMileage: d.currentMileage,
        // Main
        licensePlate:     d.licensePlate,
        manufacturer:     d.manufacturer,
        manufacturerCode: d.manufacturerCode,
        model:            d.model,
        modelCode:        d.modelCode,
        modelId:          d.modelId,
        vehicleType:      d.vehicleType,
        year:             d.year,
        color:            d.color,
        colorCode:        d.colorCode,
        fuelType:         d.fuelType,
        engineModel:      d.engineModel,
        trim:             d.trim,
        safetyRating:     d.safetyRating,
        pollutionLevel:   d.pollutionLevel,
        vin:              d.vin,
        frontTire:        d.frontTire,
        rearTire:         d.rearTire,
        lastTest:         d.lastTest   ? new Date(d.lastTest)   : null,
        testExpiry:       d.testExpiry ? new Date(d.testExpiry) : null,
        ownership:        d.ownership,
        registrationNote: d.registrationNote,
        firstRegistered:  d.firstRegistered,
        // Technical
        engineNumber:       d.engineNumber,
        testKm:             d.testKm,
        structureChange:    d.structureChange   ?? false,
        hasGrapam:          d.hasGrapam         ?? false,
        colorChange:        d.colorChange       ?? false,
        tireChange:         d.tireChange        ?? false,
        firstRegisteredDate: d.firstRegisteredDate,
        origin:             d.origin,
        // WLTP
        horsePower:           d.horsePower,
        engineCC:             d.engineCC,
        weight:               d.weight,
        doors:                d.doors,
        seats:                d.seats,
        bodyType:             d.bodyType,
        driveType:            d.driveType,
        transmission:         d.transmission,
        standardType:         d.standardType,
        towingWithBrakes:     d.towingWithBrakes,
        towingWithoutBrakes:  d.towingWithoutBrakes,
        airbags:              d.airbags,
        electricWindows:      d.electricWindows,
        hasAC:                d.hasAC             ?? false,
        hasABS:               d.hasABS            ?? false,
        hasPowerSteering:     d.hasPowerSteering  ?? false,
        hasStabControl:       d.hasStabControl    ?? false,
        hasSunroof:           d.hasSunroof        ?? false,
        hasAlloyWheels:       d.hasAlloyWheels    ?? false,
        hasTrunkRack:         d.hasTrunkRack      ?? false,
        co2:                  d.co2,
        co2City:              d.co2City,
        co2Highway:           d.co2Highway,
        nox:                  d.nox,
        co:                   d.co,
        greenScore:           d.greenScore,
        hasLaneDeparture:     d.hasLaneDeparture     ?? false,
        hasForwardWarning:    d.hasForwardWarning    ?? false,
        hasBlindSpot:         d.hasBlindSpot         ?? false,
        hasAdaptiveCruise:    d.hasAdaptiveCruise    ?? false,
        hasPedestrianDetect:  d.hasPedestrianDetect  ?? false,
        hasAutoEmergencyBrake: d.hasAutoEmergencyBrake ?? false,
        hasRearCamera:        d.hasRearCamera        ?? false,
        hasTirePressure:      d.hasTirePressure      ?? false,
        hasFatigueAlert:      d.hasFatigueAlert      ?? false,
        safetyScore:          d.safetyScore,
        hasAutoHighBeam:      d.hasAutoHighBeam      ?? false,
        hasSpeedLimiter:      d.hasSpeedLimiter      ?? false,
        hasAlcoLock:          d.hasAlcoLock          ?? false,
        ownershipHistory: d.ownershipHistory ? JSON.stringify(d.ownershipHistory) : null,
        recalls:          d.recalls          ? JSON.stringify(d.recalls)          : null,
      },
    });

    // Fetch car image from Wikimedia Commons in background (non-blocking)
    fetchCarImage(d.manufacturer, d.model, d.year, d.color).then(async (imgUrl) => {
      if (imgUrl) {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: { imageUrl: imgUrl } }).catch(() => {});
      }
    }).catch(() => {});

    if (vehicle.testExpiry) {
      await prisma.reminder.create({
        data: { vehicleId: vehicle.id, reminderType: 'TEST', title: 'טסט שנתי', dueDate: vehicle.testExpiry, intervalMonths: 12 },
      });
    }

    res.status(201).json({ vehicle: parseVehicle(vehicle) });

    // שלח מייל אישור — fire and forget
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { email: true, name: true },
      });
      if (user?.email) {
        const html = buildNewVehicleEmailHtml({ userName: user.name, vehicle: { ...parseVehicle(vehicle), hasActiveRecall: d.recalls?.length > 0 } });
        await sendEmail({
          to: user.email,
          subject: `🚗 רכב חדש נוסף: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.licensePlate})`,
          html,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send new vehicle email:', emailErr.message);
    }
  } catch (err) { next(err); }
});

// ── Yad2 market price helpers ─────────────────────────────────────────────

// Hebrew manufacturer name → Yad2 numeric ID (sourced from carinfo-bot)
const _YAD2_MAKES = {
  "אאודי": 1, "אופל": 2, "אינפיניטי": 3, "איסוזו": 4, "אלפא רומיאו": 5,
  "אם ג'י": 6, "ב מ וו": 7, "ג'יפ": 10, "גרייט וול": 11, "דאצ'יה": 12,
  "הונדה": 17, "וולוו": 18, "טויוטה": 19, "יגואר": 20, "יונדאי": 21,
  "לנד רובר": 24, "לקסוס": 26, "מאזדה": 27, "מיני": 29, "מיצובישי": 30,
  "מרצדס-בנץ": 31, "ניסאן": 32, "סאנגיונג": 34, "סובארו": 35, "סוזוקי": 36,
  "סיאט": 37, "סיטרואן": 38, "סמארט": 39, "סקודה": 40, "פולקסווגן": 41,
  "פורד": 43, "פורשה": 44, "פיאט": 45, "פיג'ו": 46, "קיה": 48, "רנו": 51,
  "שברולט": 52, "טסלה": 62, "לאדה": 80, "דונגפנג": 88, "מקסוס": 89,
  "ראם": 91, "קופרה": 92, "ג'נסיס": 93, "בי.ווי.די": 141, "ניאו": 289,
  // Aliases (alternate spellings from data.gov.il)
  "מזדה": 27, "מרצדס בנץ": 31, "סיט": 37, "מג": 6, "ב י ד": 141, "ריניה": 51,
};

function _yad2Norm(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/[''׳]/g, "'").replace(/-/g, ' ').replace(/\./g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function _getManufacturerId(name) {
  if (!name) return null;
  const n = _yad2Norm(name);
  for (const [k, v] of Object.entries(_YAD2_MAKES)) {
    if (_yad2Norm(k) === n) return v;
  }
  for (const [k, v] of Object.entries(_YAD2_MAKES)) {
    const kn = _yad2Norm(k);
    if (n.includes(kn) || kn.includes(n)) return v;
  }
  return null;
}

let _yad2ModelsCache = null;

async function _getModelId(manufacturerId, modelName) {
  if (!modelName) return null;
  if (!_yad2ModelsCache) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(
        'https://raw.githubusercontent.com/Gal9amar/carinfo-bot/main/src/yad2_models.json',
        { signal: ctrl.signal }
      );
      clearTimeout(t);
      _yad2ModelsCache = await res.json();
    } catch (e) {
      console.error('[market-price] yad2_models fetch failed:', e.message);
      return null;
    }
  }

  const mfr = _yad2ModelsCache?.manufacturers?.[String(manufacturerId)];
  if (!mfr?.models) return null;

  const norm = _yad2Norm(modelName).replace(/[''׳]/g, '');
  const models = Object.values(mfr.models);

  // Exact match first
  for (const m of models) {
    const he = _yad2Norm(m.name_he || '').replace(/[''׳]/g, '');
    const en = _yad2Norm(m.name_en || '').replace(/[''׳]/g, '');
    if (norm === he || norm === en) return Number(m.id);
  }
  // Substring match
  for (const m of models) {
    const he = _yad2Norm(m.name_he || '').replace(/[''׳]/g, '');
    const en = _yad2Norm(m.name_en || '').replace(/[''׳]/g, '');
    if (norm.length >= 3 && (he.includes(norm) || norm.includes(he) || en.includes(norm) || norm.includes(en))) return Number(m.id);
  }
  // Prefix match (first 5 chars)
  if (norm.length >= 4) {
    const pfx = norm.slice(0, 5);
    for (const m of models) {
      const en = _yad2Norm(m.name_en || '').replace(/[''׳]/g, '');
      const he = _yad2Norm(m.name_he || '').replace(/[''׳]/g, '');
      for (const key of [en, he]) {
        if (!key) continue;
        if ((key.startsWith(pfx) || norm.startsWith(key.slice(0, 5))) && Math.abs(key.length - norm.length) <= 3) return Number(m.id);
      }
    }
  }
  return null;
}

// GET /api/vehicles/:id/market-price
router.get('/:id/market-price', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { manufacturer: true, model: true, year: true },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    // Use IP proxy — accepts manufacturer+model+year+rows+secret
    const workerUrl = process.env.YAD2_CF_WORKER_URL;
    const proxyUrl  = process.env.YAD2_PROXY_URL;
    if (!workerUrl && !proxyUrl) return res.status(503).json({ error: 'Market price service not configured.' });
    const proxySecret = process.env.YAD2_PROXY_SECRET || 'carinfo2026';

    const manufacturerId = _getManufacturerId(vehicle.manufacturer);
    console.log('[market-price] manufacturer:', vehicle.manufacturer, '→', manufacturerId, '| model:', vehicle.model, '| year:', vehicle.year);

    if (!manufacturerId) {
      return res.json({ marketPrice: { prices: null, totalOnRoad: 0, manufacturer: vehicle.manufacturer, model: vehicle.model, year: vehicle.year } });
    }

    const modelId = await _getModelId(manufacturerId, vehicle.model);
    console.log('[market-price] modelId:', modelId, 'for', vehicle.model);

    if (!modelId) {
      return res.json({ marketPrice: { prices: null, totalOnRoad: 0, manufacturer: vehicle.manufacturer, model: vehicle.model, year: vehicle.year } });
    }

    const yearRange = vehicle.year ? `${vehicle.year}-${vehicle.year}` : null;

    // Fetch via IP proxy — supports both feed (type=feed) and lookalike
    const fetchProxy = async (type, withYear) => {
      if (!proxyUrl) return null;
      const p = new URLSearchParams({ manufacturer: manufacturerId, model: modelId, rows: '100', secret: proxySecret });
      if (type === 'feed') p.set('type', 'feed');
      if (withYear && yearRange) p.set('year', yearRange);
      const url = `${proxyUrl}?${p}`;
      console.log(`[market-price] proxy ${type}${withYear ? '+year' : ''} url:`, url.replace(proxySecret, '***'));
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) { const b = await r.text().catch(() => ''); console.warn(`[market-price] proxy ${type}:`, r.status, b.slice(0, 200)); return null; }
        return r.json();
      } catch (e) { console.warn(`[market-price] proxy ${type} err:`, e.message); return null; }
      finally { clearTimeout(t); }
    };

    // Try: proxy feed+year → proxy feed → proxy lookalike+year → proxy lookalike
    let data = await fetchProxy('feed', true);
    let rawItems = _extractItems(data);
    let source = 'proxy-feed+year';
    console.log(`[market-price] proxy feed+year: ${rawItems.length} items`);

    if (!rawItems.length) {
      source = 'proxy-feed';
      data = await fetchProxy('feed', false);
      rawItems = _extractItems(data);
      console.log(`[market-price] proxy feed: ${rawItems.length} items`);
    }
    if (!rawItems.length) {
      source = 'proxy-lookalike+year';
      data = await fetchProxy('lookalike', true);
      rawItems = _extractItems(data);
      console.log(`[market-price] proxy lookalike+year: ${rawItems.length} items`);
    }
    if (!rawItems.length) {
      source = 'proxy-lookalike';
      data = await fetchProxy('lookalike', false);
      rawItems = _extractItems(data);
      console.log(`[market-price] proxy lookalike: ${rawItems.length} items`);
    }

    console.log(`[market-price] final source=${source}, ${rawItems.length} items`);

    // Filter to exact manufacturer+model matches only
    const exactItems = rawItems.filter(i =>
      Number(i.manufacturer?.id ?? i.manufacturer ?? -1) === Number(manufacturerId) &&
      Number(i.model?.id ?? i.model ?? -1) === Number(modelId)
    );
    console.log(`[market-price] exact match (mfr=${manufacturerId}, model=${modelId}): ${exactItems.length} items`);
    const itemsForCalc = exactItems.length >= 3 ? exactItems : rawItems;

    let prices = _calcPrices(itemsForCalc, vehicle.year);

    console.log('[market-price] final prices:', JSON.stringify(prices));
    res.json({ marketPrice: { prices, totalOnRoad: prices?.count ?? 0, manufacturer: vehicle.manufacturer, model: vehicle.model, year: vehicle.year } });
  } catch (err) { next(err); }
});

function _extractItems(data) {
  if (!data) return [];
  const items = Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.data?.feed_items) ? data.data.feed_items
    : Array.isArray(data?.data?.items)      ? data.data.items
    : Array.isArray(data?.items)            ? data.items
    : [];
  return items;
}

function _calcPrices(items, filterYear) {
  if (!items.length) return null;
  let filtered = items;
  if (filterYear) {
    const byYear = items.filter(i =>
      Number(i.vehicleDates?.yearOfProduction ?? i.yearOfProduction ?? i.year ?? 0) === Number(filterYear)
    );
    if (byYear.length >= 3) filtered = byYear;
  }
  const priceArr = filtered.map(i => Number(i.price ?? 0)).filter(p => p > 0);
  if (!priceArr.length) return null;
  const kmArr = filtered.map(i => Number(i.km ?? 0)).filter(k => k > 0);
  const sorted = [...priceArr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const trim = Math.max(1, Math.floor(sorted.length * 0.1));
  const trimmed = sorted.length >= 10 ? sorted.slice(trim, sorted.length - trim) : sorted;
  return {
    avg:    Math.round(priceArr.reduce((a, b) => a + b, 0) / priceArr.length),
    median: sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
    min:    trimmed[0],
    max:    trimmed[trimmed.length - 1],
    count:  priceArr.length,
    avgKm:  kmArr.length ? Math.round(kmArr.reduce((a, b) => a + b, 0) / kmArr.length) : null,
  };
}

function extractMarketPrices(data, filterYear) {
  if (!data) return null;
  try {
    // Proxy returns { data: [...] } — flat array
    let items = Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.data?.items)  ? data.data.items
      : Array.isArray(data?.items)        ? data.items
      : null;

    if (!items || !items.length) {
      // Fallback: pre-computed stats
      const avg = Number(data?.data?.price_average ?? data?.price_average ?? 0);
      const min = Number(data?.data?.price_min    ?? data?.price_min    ?? 0);
      const max = Number(data?.data?.price_max    ?? data?.price_max    ?? 0);
      const count = Number(data?.data?.total      ?? data?.total        ?? 0);
      if (avg > 0) return { avg, min, max, count };
      return null;
    }

    // Filter by year: field is vehicleDates.yearOfProduction (from carinfo-bot)
    if (filterYear) {
      const yearItems = items.filter(i =>
        Number(i.vehicleDates?.yearOfProduction ?? i.yearOfProduction ?? i.year ?? 0) === Number(filterYear)
      );
      if (yearItems.length >= 3) items = yearItems;
    }

    const priceArr = items.map(i => Number(i.price ?? 0)).filter(p => p > 0);
    if (!priceArr.length) return null;
    const kmArr = items.map(i => Number(i.km ?? 0)).filter(k => k > 0);
    const sorted = [...priceArr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    // Trim bottom and top 10% to exclude outliers for min/max
    const trim = Math.max(1, Math.floor(sorted.length * 0.1));
    const trimmed = sorted.length >= 10 ? sorted.slice(trim, sorted.length - trim) : sorted;

    return {
      avg:    Math.round(priceArr.reduce((a, b) => a + b, 0) / priceArr.length),
      median: sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2),
      min:    trimmed[0],
      max:    trimmed[trimmed.length - 1],
      count:  priceArr.length,
      avgKm:  kmArr.length ? Math.round(kmArr.reduce((a, b) => a + b, 0) / kmArr.length) : null,
    };
  } catch { return null; }
}

// GET /api/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        services:  { include: { garage: { select: { id: true, name: true } }, attachments: true }, orderBy: { date: 'desc' }, take: 20 },
        expenses:  { orderBy: { date: 'desc' }, take: 20 },
        reminders: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ vehicle: parseVehicle(vehicle) });
  } catch (err) { next(err); }
});

// PUT /api/vehicles/:id  (user-editable fields only)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });
    const data = z.object({
      currentMileage: intOpt,
      nickname: strOpt,
      imageUrl: z.string().url().optional().nullable(),
    }).parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ vehicle: parseVehicle(vehicle) });
  } catch (err) { next(err); }
});

// POST /api/vehicles/:id/refresh  — re-fetch all gov data and update DB
router.post('/:id/refresh', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    const fresh = await lookupVehicle(existing.licensePlate);
    if (!fresh) return res.status(502).json({ error: 'Could not fetch data from government database.' });

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        manufacturer:     fresh.manufacturer,
        manufacturerCode: fresh.manufacturerCode,
        model:            fresh.model,
        modelCode:        fresh.modelCode,
        modelId:          fresh.modelId,
        vehicleType:      fresh.vehicleType,
        color:            fresh.color,
        colorCode:        fresh.colorCode,
        fuelType:         fresh.fuelType,
        engineModel:      fresh.engineModel,
        trim:             fresh.trim,
        safetyRating:     fresh.safetyRating,
        pollutionLevel:   fresh.pollutionLevel,
        vin:              fresh.vin,
        frontTire:        fresh.frontTire,
        rearTire:         fresh.rearTire,
        lastTest:         fresh.lastTest   ? new Date(fresh.lastTest)   : null,
        testExpiry:       fresh.testExpiry ? new Date(fresh.testExpiry) : null,
        ownership:        fresh.ownership,
        registrationNote: fresh.registrationNote,
        firstRegistered:  fresh.firstRegistered,
        engineNumber:       fresh.engineNumber,
        testKm:             fresh.testKm,
        structureChange:    fresh.structureChange   ?? false,
        hasGrapam:          fresh.hasGrapam         ?? false,
        colorChange:        fresh.colorChange       ?? false,
        tireChange:         fresh.tireChange        ?? false,
        firstRegisteredDate: fresh.firstRegisteredDate,
        origin:             fresh.origin,
        horsePower:           fresh.horsePower,
        engineCC:             fresh.engineCC,
        weight:               fresh.weight,
        doors:                fresh.doors,
        seats:                fresh.seats,
        bodyType:             fresh.bodyType,
        driveType:            fresh.driveType,
        transmission:         fresh.transmission,
        standardType:         fresh.standardType,
        towingWithBrakes:     fresh.towingWithBrakes,
        towingWithoutBrakes:  fresh.towingWithoutBrakes,
        airbags:              fresh.airbags,
        electricWindows:      fresh.electricWindows,
        hasAC:                fresh.hasAC             ?? false,
        hasABS:               fresh.hasABS            ?? false,
        hasPowerSteering:     fresh.hasPowerSteering  ?? false,
        hasStabControl:       fresh.hasStabControl    ?? false,
        hasSunroof:           fresh.hasSunroof        ?? false,
        hasAlloyWheels:       fresh.hasAlloyWheels    ?? false,
        hasTrunkRack:         fresh.hasTrunkRack      ?? false,
        co2:                  fresh.co2,
        co2City:              fresh.co2City,
        co2Highway:           fresh.co2Highway,
        nox:                  fresh.nox,
        co:                   fresh.co,
        greenScore:           fresh.greenScore,
        hasLaneDeparture:     fresh.hasLaneDeparture     ?? false,
        hasForwardWarning:    fresh.hasForwardWarning    ?? false,
        hasBlindSpot:         fresh.hasBlindSpot         ?? false,
        hasAdaptiveCruise:    fresh.hasAdaptiveCruise    ?? false,
        hasPedestrianDetect:  fresh.hasPedestrianDetect  ?? false,
        hasAutoEmergencyBrake: fresh.hasAutoEmergencyBrake ?? false,
        hasRearCamera:        fresh.hasRearCamera        ?? false,
        hasTirePressure:      fresh.hasTirePressure      ?? false,
        hasFatigueAlert:      fresh.hasFatigueAlert      ?? false,
        safetyScore:          fresh.safetyScore,
        hasAutoHighBeam:      fresh.hasAutoHighBeam      ?? false,
        hasSpeedLimiter:      fresh.hasSpeedLimiter      ?? false,
        hasAlcoLock:          fresh.hasAlcoLock          ?? false,
        ownershipHistory: fresh.ownershipHistory ? JSON.stringify(fresh.ownershipHistory) : null,
        recalls:          fresh.recalls          ? JSON.stringify(fresh.recalls)          : null,
        govDataUpdatedAt: new Date(),
      },
      include: {
        services:  { include: { garage: { select: { id: true, name: true } }, attachments: true }, orderBy: { date: 'desc' }, take: 20 },
        expenses:  { orderBy: { date: 'desc' }, take: 20 },
        reminders: { orderBy: { dueDate: 'asc' } },
      },
    });

    // Update test reminder if testExpiry changed
    if (updated.testExpiry) {
      const existingReminder = await prisma.reminder.findFirst({
        where: { vehicleId: updated.id, reminderType: 'TEST' },
      });
      if (existingReminder) {
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: { dueDate: updated.testExpiry },
        });
      }
    }

    res.json({ vehicle: parseVehicle(updated), refreshed: true });
  } catch (err) {
    console.error('❌ Refresh error:', err.message, err.stack);
    next(err);
  }
});


// POST /api/vehicles/:id/refresh-image — fetch/re-fetch car image from Wikipedia
router.post('/:id/refresh-image', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const imgUrl = await fetchCarImage(vehicle.manufacturer, vehicle.model, vehicle.year, vehicle.color);
    if (!imgUrl) return res.json({ imageUrl: null, found: false });

    await prisma.vehicle.update({ where: { id: req.params.id }, data: { imageUrl: imgUrl } });
    res.json({ imageUrl: imgUrl, found: true });
  } catch (err) { next(err); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted.' });
  } catch (err) { next(err); }
});

export default router;
