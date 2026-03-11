import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// ============================================
// GET /api/garages?city=xxx&search=xxx
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { city, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [garages, total] = await Promise.all([
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

    // Calculate average rating
    const garagesWithRating = garages.map(g => {
      const avgRating = g.reviews.length
        ? g.reviews.reduce((sum, r) => sum + r.rating, 0) / g.reviews.length
        : null;
      const { reviews, ...rest } = g;
      return { ...rest, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null };
    });

    res.json({ garages: garagesWithRating, total, page: Number(page), limit: Number(limit) });
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
