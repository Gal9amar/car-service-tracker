import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const ADMIN_EMAIL = 'ga9service@gmail.com';

function requireAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'גישה אסורה.' });
  }
  next();
}

// GET /api/admin/users – כל המשתמשים עם הרכבים, שירותים והוצאות
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        vehicles: {
          select: {
            id: true,
            nickname: true,
            licensePlate: true,
            manufacturer: true,
            model: true,
            year: true,
            currentMileage: true,
            fuelType: true,
            testExpiry: true,
            createdAt: true,
            _count: { select: { services: true, expenses: true, reminders: true } },
            services: {
              orderBy: { date: 'desc' },
              take: 5,
              select: {
                id: true,
                serviceType: true,
                description: true,
                date: true,
                mileage: true,
                cost: true,
              },
            },
            expenses: {
              orderBy: { date: 'desc' },
              take: 5,
              select: {
                id: true,
                category: true,
                description: true,
                date: true,
                amount: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { vehicles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

export default router;
