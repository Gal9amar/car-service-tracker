import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// ============================================
// GET /api/dashboard
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Get all vehicles with recent data
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      include: {
        services: { orderBy: { date: 'desc' }, take: 1 },
        _count: { select: { services: true, expenses: true } },
      },
    });

    // Upcoming reminders (next 30 days)
    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        vehicle: { userId },
        isActive: true,
        dueDate: { lte: thirtyDaysFromNow, gte: now },
      },
      include: {
        vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    // Overdue reminders
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        vehicle: { userId },
        isActive: true,
        dueDate: { lt: now },
      },
      include: {
        vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // This month's expenses
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = await prisma.expense.aggregate({
      where: { vehicle: { userId }, date: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const monthServices = await prisma.service.aggregate({
      where: { vehicle: { userId }, date: { gte: startOfMonth } },
      _sum: { cost: true },
    });

    // Vehicles with expiring test (next 60 days)
    const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const expiringTest = vehicles.filter(v =>
      v.testExpiry && new Date(v.testExpiry) <= sixtyDays
    );

    res.json({
      dashboard: {
        vehicleCount: vehicles.length,
        vehicles: vehicles.map(v => ({
          id: v.id,
          licensePlate: v.licensePlate,
          manufacturer: v.manufacturer,
          model: v.model,
          year: v.year,
          nickname: v.nickname,
          imageUrl: v.imageUrl,
          currentMileage: v.currentMileage,
          testExpiry: v.testExpiry,
          lastService: v.services[0] || null,
          serviceCount: v._count.services,
          expenseCount: v._count.expenses,
        })),
        upcomingReminders,
        overdueReminders,
        expiringTest,
        monthlySpend: {
          expenses: Number(monthExpenses._sum.amount) || 0,
          services: Number(monthServices._sum.cost) || 0,
          total: (Number(monthExpenses._sum.amount) || 0) + (Number(monthServices._sum.cost) || 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
