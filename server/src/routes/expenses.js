import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const categories = ['FUEL', 'PARKING', 'FINE', 'INSURANCE', 'LICENSE', 'TOLL', 'WASH', 'ACCESSORIES', 'OTHER'];

const createExpenseSchema = z.object({
  vehicleId: z.string().uuid(),
  category: z.enum(categories),
  amount: z.number().min(0),
  date: z.string(),
  description: z.string().optional(),
});

// ============================================
// GET /api/expenses?vehicleId=xxx
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { vehicleId, from, to } = req.query;

    const where = { vehicle: { userId: req.user.id } };
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: { select: { id: true, licensePlate: true, manufacturer: true, model: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/expenses/summary
// ============================================
router.get('/summary', async (req, res, next) => {
  try {
    const { vehicleId, months = 12 } = req.query;
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - Number(months));

    const where = {
      vehicle: { userId: req.user.id },
      date: { gte: fromDate },
    };
    if (vehicleId) where.vehicleId = vehicleId;

    // Expense totals by category
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Service costs
    const serviceWhere = {
      vehicle: { userId: req.user.id },
      date: { gte: fromDate },
    };
    if (vehicleId) serviceWhere.vehicleId = vehicleId;

    const serviceCosts = await prisma.service.aggregate({
      where: serviceWhere,
      _sum: { cost: true },
      _count: true,
    });

    // Monthly breakdown
    const allExpenses = await prisma.expense.findMany({
      where,
      select: { amount: true, date: true, category: true },
      orderBy: { date: 'asc' },
    });

    const allServices = await prisma.service.findMany({
      where: serviceWhere,
      select: { cost: true, date: true },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthlyMap = {};
    allExpenses.forEach(e => {
      const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, expenses: 0, services: 0 };
      monthlyMap[key].expenses += Number(e.amount);
    });
    allServices.forEach(s => {
      const key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: key, expenses: 0, services: 0 };
      monthlyMap[key].services += Number(s.cost);
    });

    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary: {
        byCategory,
        serviceCosts: {
          total: Number(serviceCosts._sum.cost) || 0,
          count: serviceCosts._count,
        },
        monthly,
        totalExpenses: byCategory.reduce((sum, c) => sum + Number(c._sum.amount), 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// GET /api/expenses/annual?year=2024
// ============================================
router.get('/annual', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);
    const userId = req.user.id;

    const expWhere = { vehicle: { userId }, date: { gte: from, lte: to } };
    const svcWhere = { vehicle: { userId }, date: { gte: from, lte: to } };

    const [expAgg, svcAgg, byCategory, servicesList, expensesList] = await Promise.all([
      prisma.expense.aggregate({ where: expWhere, _sum: { amount: true } }),
      prisma.service.aggregate({ where: svcWhere, _sum: { cost: true } }),
      prisma.expense.groupBy({
        by: ['category'],
        where: expWhere,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.service.findMany({
        where: svcWhere,
        select: {
          id: true,
          serviceType: true,
          cost: true,
          date: true,
          vehicle: { select: { licensePlate: true, manufacturer: true, model: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: expWhere,
        select: {
          id: true,
          category: true,
          amount: true,
          date: true,
          description: true,
          vehicle: { select: { licensePlate: true, manufacturer: true, model: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const expensesTotal = Number(expAgg._sum.amount) || 0;
    const servicesTotal = Number(svcAgg._sum.cost) || 0;

    res.json({
      annual: {
        year,
        expenses: expensesTotal,
        services: servicesTotal,
        total: expensesTotal + servicesTotal,
        byCategory: byCategory.map(c => ({ category: c.category, amount: Number(c._sum.amount) || 0 })),
        servicesList: servicesList.map(s => ({
          id: s.id,
          serviceType: s.serviceType,
          cost: Number(s.cost) || 0,
          date: s.date,
          licensePlate: s.vehicle.licensePlate,
          vehicleName: `${s.vehicle.manufacturer} ${s.vehicle.model}`,
        })),
        expensesList: expensesList.map(e => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount) || 0,
          date: e.date,
          description: e.description,
          licensePlate: e.vehicle.licensePlate,
          vehicleName: `${e.vehicle.manufacturer} ${e.vehicle.model}`,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ============================================
// POST /api/expenses
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: req.user.id },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const expense = await prisma.expense.create({
      data: { ...data, date: new Date(data.date) },
    });

    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
});

// ============================================
// PUT /api/expenses/:id
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Expense not found.' });

    const updateSchema = z.object({
      category: z.enum(categories).optional(),
      amount: z.number().min(0).optional(),
      date: z.string().optional(),
      description: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    });

    res.json({ expense });
  } catch (err) {
    next(err);
  }
});

// ============================================
// DELETE /api/expenses/:id
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, vehicle: { userId: req.user.id } },
    });
    if (!existing) return res.status(404).json({ error: 'Expense not found.' });

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
