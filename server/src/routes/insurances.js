import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail, buildNewInsuranceEmailHtml } from '../services/emailService.js';

const router = Router();
router.use(authenticate);

const insuranceTypes = ['MANDATORY', 'THIRD_PARTY', 'COMPREHENSIVE'];

const createSchema = z.object({
  vehicleId:     z.string().uuid(),
  insuranceType: z.enum(insuranceTypes),
  company:       z.string().min(1),
  policyNumber:  z.string().optional().nullable(),
  startDate:     z.string(),
  endDate:       z.string(),
  cost:          z.number().min(0).optional().nullable(),
  notes:         z.string().optional().nullable(),
});

// GET /api/insurances?vehicleId=xxx
router.get('/', async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const where = { vehicle: { userId: req.user.id } };
    if (vehicleId) where.vehicleId = vehicleId;
    const insurances = await prisma.insurance.findMany({
      where,
      include: { vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true } } },
      orderBy: [{ isActive: 'desc' }, { endDate: 'desc' }],
    });
    res.json({ insurances });
  } catch (err) { next(err); }
});

// POST /api/insurances
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    // סמן ביטוח קיים מאותו סוג כלא פעיל — רק אם הביטוח החדש מתחיל היום או קודם
    // (אם מתחיל עתידי, הישן עדיין תקף ויש להציגו)
    const newStart = new Date(data.startDate);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    if (newStart <= todayStart) {
      await prisma.insurance.updateMany({
        where: { vehicleId: data.vehicleId, insuranceType: data.insuranceType, isActive: true },
        data: { isActive: false },
      });
    }

    const insurance = await prisma.insurance.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate:   new Date(data.endDate),
      },
    });

    // צור תזכורת אוטומטית לפקיעת הביטוח — בטל תזכורות ישנות מאותו סוג
    const reminderTitle = `ביטוח ${{ MANDATORY: 'חובה', THIRD_PARTY: "צד ג'", COMPREHENSIVE: 'מקיף' }[insurance.insuranceType]} — ${insurance.company}`;
    await prisma.reminder.updateMany({
      where: {
        vehicleId:    data.vehicleId,
        reminderType: 'INSURANCE',
        title:        { contains: { MANDATORY: 'חובה', THIRD_PARTY: "צד ג", COMPREHENSIVE: 'מקיף' }[insurance.insuranceType] },
        isActive:     true,
      },
      data: { isActive: false },
    });
    await prisma.reminder.create({
      data: {
        vehicleId:     data.vehicleId,
        reminderType:  'INSURANCE',
        title:         reminderTitle,
        dueDate:       new Date(data.endDate),
        intervalMonths: 12,
      },
    });

    // שלח מייל אישור
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, name: true } });
      if (user?.email) {
        const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: 'צד ג\'', COMPREHENSIVE: 'מקיף' };
        await sendEmail({
          to: user.email,
          subject: `🛡️ ביטוח ${typeLabel[insurance.insuranceType]} נוסף: ${vehicle.manufacturer} ${vehicle.model}`,
          html: buildNewInsuranceEmailHtml({ userName: user.name, insurance, vehicle }),
        });
      }
    } catch (e) { console.error('Insurance email failed:', e.message); }

    res.status(201).json({ insurance });
  } catch (err) { next(err); }
});

// PUT /api/insurances/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.insurance.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Insurance not found.' });

    const data = z.object({
      company:      z.string().min(1).optional(),
      policyNumber: z.string().optional().nullable(),
      startDate:    z.string().optional(),
      endDate:      z.string().optional(),
      cost:         z.number().min(0).optional().nullable(),
      notes:        z.string().optional().nullable(),
      isActive:     z.boolean().optional(),
    }).parse(req.body);

    const insurance = await prisma.insurance.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate:   data.endDate   ? new Date(data.endDate)   : undefined,
      },
    });
    res.json({ insurance });
  } catch (err) { next(err); }
});

// DELETE /api/insurances/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.insurance.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Insurance not found.' });
    await prisma.insurance.delete({ where: { id: req.params.id } });
    res.json({ message: 'Insurance deleted.' });
  } catch (err) { next(err); }
});

export default router;
