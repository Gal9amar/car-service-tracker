import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// ============================================
// Overpass API — חיפוש מוסכים מ-OpenStreetMap
// ============================================
async function searchGaragesFromOSM(city, search) {
  // bbox ישראל: (south, west, north, east)
  const ISRAEL_BBOX = '29.5,34.2,33.3,35.9';
  const nameFilter = search ? `["name"~"${search}",i]` : '';
  const cityFilter = city ? `["addr:city"~"${city}",i]` : '';
  const bbox = `(${ISRAEL_BBOX})`;

  const query = `
    [out:json][timeout:20];
    (
      node["shop"="car_repair"]${nameFilter}${cityFilter}${bbox};
      way["shop"="car_repair"]${nameFilter}${cityFilter}${bbox};
      node["amenity"="car_repair"]${nameFilter}${cityFilter}${bbox};
      way["amenity"="car_repair"]${nameFilter}${cityFilter}${bbox};
    );
    out center 50;
  `;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) throw new Error('Overpass API error');

  const data = await response.json();

  return data.elements.map((el) => {
    const tags = el.tags || {};
    const lat = el.lat ?? el.center?.lat ?? null;
    const lng = el.lon ?? el.center?.lon ?? null;

    return {
      id: `osm-${el.type}-${el.id}`,
      name: tags.name || tags['name:he'] || 'מוסך',
      address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || null,
      city: tags['addr:city'] || tags['addr:place'] || city || null,
      phone: tags.phone || tags['contact:phone'] || null,
      lat,
      lng,
      specialties: [],
      avgRating: null,
      source: 'osm',
      _count: { reviews: 0, services: 0 },
    };
  });
}

// ============================================
// GET /api/garages?city=xxx&search=xxx
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { city, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // 1. חפש קודם ב-DB המקומי
    const where = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [dbGarages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        include: {
          reviews: { select: { rating: true } },
          _count: { select: { reviews: true, services: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.garage.count({ where }),
    ]);

    const garagesWithRating = dbGarages.map((g) => {
      const avgRating = g.reviews.length
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : null;
      const { reviews, ...rest } = g;
      return { ...rest, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null, source: 'db' };
    });

    // 2. אם ה-DB ריק — שלוף מ-OpenStreetMap
    if (garagesWithRating.length === 0) {
      try {
        const osmGarages = await searchGaragesFromOSM(city, search);
        return res.json({
          garages: osmGarages,
          total: osmGarages.length,
          page: 1,
          limit: osmGarages.length,
          source: 'osm',
        });
      } catch (osmErr) {
        console.error('Overpass API error:', osmErr.message);
        // אם OSM נכשל — החזר רשימה ריקה בצורה נקייה
        return res.json({ garages: [], total: 0, page: Number(page), limit: Number(limit), source: 'osm_error' });
      }
    }

    res.json({ garages: garagesWithRating, total, page: Number(page), limit: Number(limit), source: 'db' });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/garages
// ============================================
const createGarageSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  specialties: z.array(z.string()).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createGarageSchema.parse(req.body);
    const garage = await prisma.garage.create({
      data: { ...data, createdBy: req.user.id },
    });
    res.status(201).json({ garage });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/garages/:id
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const garage = await prisma.garage.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { services: true } },
      },
    });

    if (!garage) return res.status(404).json({ error: 'Garage not found.' });

    const avgRating = garage.reviews.length
      ? garage.reviews.reduce((sum, r) => sum + r.rating, 0) / garage.reviews.length
      : null;

    res.json({ garage: { ...garage, avgRating } });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/garages/:id/reviews
// ============================================
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.post('/:id/reviews', async (req, res, next) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const garage = await prisma.garage.findUnique({ where: { id: req.params.id } });
    if (!garage) return res.status(404).json({ error: 'Garage not found.' });

    const review = await prisma.garageReview.upsert({
      where: { garageId_userId: { garageId: req.params.id, userId: req.user.id } },
      update: { rating: data.rating, comment: data.comment },
      create: { garageId: req.params.id, userId: req.user.id, rating: data.rating, comment: data.comment },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

// ============================================
// DELETE /api/garages/:garageId/reviews
// ============================================
router.delete('/:garageId/reviews', async (req, res, next) => {
  try {
    await prisma.garageReview.delete({
      where: { garageId_userId: { garageId: req.params.garageId, userId: req.user.id } },
    });
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;

