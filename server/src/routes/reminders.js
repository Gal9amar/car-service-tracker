import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const reminderTypes = ['TEST', 'OIL', 'INSURANCE', 'LICENSE', 'TIRES', 'BRAKES', 'CUSTOM'];

const createReminderSchema = z.object({
  vehicleId: z.string().uuid(),
  reminderType: z.enum(reminderTypes),
  title: z.string().min(1),
  dueDate: z.string().optional(),
  dueMileage: z.number().int().optional(),
  intervalMonths: z.number().int().optional(),
  intervalKm: z.number().int().optional(),
});

// ============================================
// GET /api/reminders?vehicleId=xxx
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { vehicleId, activeOnly } = req.query;

    const where = { vehicle: { userId: req.user.id } };
    if (vehicleId) where.vehicleId = vehicleId;
    if (activeOnly === 'true') where.isActive = true;

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true, currentMileage: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json({ reminders });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/reminders
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const data = createReminderSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const reminder = await prisma.reminder.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    res.status(201).json({ reminder });
  } catch (err) {
    next(err);
  }
});

// ============================================
// PUT /api/reminders/:id
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Reminder not found.' });

    const updateSchema = z.object({
      title: z.string().min(1).optional(),
      dueDate: z.string().optional().nullable(),
      dueMileage: z.number().int().optional().nullable(),
      intervalMonths: z.number().int().optional().nullable(),
      intervalKm: z.number().int().optional().nullable(),
      isActive: z.boolean().optional(),
    });

    const data = updateSchema.parse(req.body);
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
      },
    });

    res.json({ reminder });
  } catch (err) {
    next(err);
  }
});

// ============================================
// DELETE /api/reminders/:id
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Reminder not found.' });

    await prisma.reminder.delete({ where: { id: req.params.id } });
    res.json({ message: 'Reminder deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
