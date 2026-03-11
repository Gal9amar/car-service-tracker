import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const serviceTypes = ['PERIODIC', 'OIL', 'BRAKES', 'TIRES', 'BATTERY', 'TEST', 'AC',
  'TIMING_BELT', 'FILTERS', 'SUSPENSION', 'ELECTRICAL', 'BODY_WORK', 'GENERAL', 'OTHER'];

const createServiceSchema = z.object({
  vehicleId: z.string().uuid(),
  serviceType: z.enum(serviceTypes),
  description: z.string().optional(),
  date: z.string(),
  mileage: z.number().int().optional(),
  cost: z.number().min(0),
  garageId: z.string().uuid().optional(),
  warrantyUntil: z.string().optional(),
  nextServiceMileage: z.number().int().optional(),
});

// ============================================
// GET /api/services?vehicleId=xxx
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { vehicleId } = req.query;

    // Verify ownership
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, userId: req.user.id },
      });
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
    }

    const services = await prisma.service.findMany({
      where: vehicleId ? { vehicleId } : { vehicle: { userId: req.user.id } },
      include: {
        vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true } },
        garage: { select: { id: true, name: true } },
        attachments: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ services });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/services
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const data = createServiceSchema.parse(req.body);

    // Verify vehicle ownership
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const service = await prisma.service.create({
      data: {
        ...data,
        date: new Date(data.date),
        warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
        nextServiceMileage: data.nextServiceMileage || null,
      },
      include: { garage: { select: { id: true, name: true } } },
    });

    // Update vehicle mileage if provided and higher than current
    if (data.mileage && (!vehicle.currentMileage || data.mileage > vehicle.currentMileage)) {
      await prisma.vehicle.update({
        where: { id: data.vehicleId },
        data: { currentMileage: data.mileage },
      });
    }

    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
});

// ============================================
// PUT /api/services/:id
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Service not found.' });

    const updateSchema = z.object({
      serviceType: z.enum(serviceTypes).optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      mileage: z.number().int().optional(),
      cost: z.number().min(0).optional(),
      garageId: z.string().uuid().optional().nullable(),
      warrantyUntil: z.string().optional().nullable(),
      nextServiceMileage: z.number().int().optional().nullable(),
    });

    const data = updateSchema.parse(req.body);
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : data.warrantyUntil === null ? null : undefined,
        nextServiceMileage: data.nextServiceMileage !== undefined ? data.nextServiceMileage : undefined,
      },
    });

    res.json({ service });
  } catch (err) {
    next(err);
  }
});

// ============================================
// DELETE /api/services/:id
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Service not found.' });

    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ message: 'Service deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
