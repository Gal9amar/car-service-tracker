import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { lookupVehicle } from '../services/vehicleLookup.js';

const router = Router();
router.use(authenticate);

// ============================================
// GET /api/vehicles/lookup/:plate
// ============================================
router.get('/lookup/:plate', async (req, res, next) => {
  try {
    const result = await lookupVehicle(req.params.plate);
    if (!result) {
      return res.status(404).json({ error: 'Vehicle not found in government database.' });
    }
    res.json({ vehicle: result });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/vehicles
// ============================================
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
    res.json({ vehicles });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/vehicles
// ============================================
const createVehicleSchema = z.object({
  licensePlate: z.string().min(5).max(10),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2030),
  color: z.string().optional(),
  fuelType: z.string().optional(),
  engineModel: z.string().optional(),
  trim: z.string().optional(),
  vin: z.string().optional(),
  frontTire: z.string().optional(),
  rearTire: z.string().optional(),
  testExpiry: z.string().optional(),
  lastTest: z.string().optional(),
  firstRegistered: z.string().optional(),
  currentMileage: z.number().int().optional(),
  nickname: z.string().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createVehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        userId: req.user.id,
        testExpiry: data.testExpiry ? new Date(data.testExpiry) : null,
        lastTest: data.lastTest ? new Date(data.lastTest) : null,
      },
    });

    // Auto-create test reminder if test expiry exists
    if (vehicle.testExpiry) {
      await prisma.reminder.create({
        data: {
          vehicleId: vehicle.id,
          reminderType: 'TEST',
          title: 'טסט שנתי',
          dueDate: vehicle.testExpiry,
          intervalMonths: 12,
        },
      });
    }

    res.status(201).json({ vehicle });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/vehicles/:id
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        services: {
          include: { garage: { select: { id: true, name: true } }, attachments: true },
          orderBy: { date: 'desc' },
          take: 20,
        },
        expenses: { orderBy: { date: 'desc' }, take: 20 },
        reminders: { orderBy: { dueDate: 'asc' } },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
});

// ============================================
// PUT /api/vehicles/:id
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const updateSchema = z.object({
      currentMileage: z.number().int().optional(),
      nickname: z.string().optional(),
      imageUrl: z.string().url().optional(),
    });

    const data = updateSchema.parse(req.body);
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ vehicle });
  } catch (err) {
    next(err);
  }
});

// ============================================
// DELETE /api/vehicles/:id
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
