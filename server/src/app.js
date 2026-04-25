import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import serviceRoutes from './routes/services.js';
import expenseRoutes from './routes/expenses.js';
import reminderRoutes from './routes/reminders.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import insuranceRoutes from './routes/insurances.js';
import prisma from './utils/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

app.use(cors({
  origin: (origin, callback) => {
    // allow same-origin requests (no origin header) and allowed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // in production, also allow the railway domain automatically
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});


// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/insurances', insuranceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// SERVE FRONTEND IN PRODUCTION
// ============================================

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER (local dev only)
// ============================================
if (process.env.NODE_ENV !== 'production') {
  import('./services/reminderCron.js').then(({ startReminderCron }) => {
    app.listen(PORT, async () => {
      console.log(`🚗 Car Service Tracker server running on port ${PORT}`);
      startReminderCron();
      await createMissingInsuranceReminders();
    });
  });
}

// ── חד-פעמי: יצירת תזכורות לביטוחים קיימים ללא תזכורת ────────────────────
async function createMissingInsuranceReminders() {
  try {
    const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: "צד ג'", COMPREHENSIVE: 'מקיף' };
    const insurances = await prisma.insurance.findMany({
      where: { isActive: true },
      select: { id: true, vehicleId: true, insuranceType: true, company: true, endDate: true },
    });

    let created = 0;
    for (const ins of insurances) {
      const title = `ביטוח ${typeLabel[ins.insuranceType]} — ${ins.company}`;
      const existing = await prisma.reminder.findFirst({
        where: { vehicleId: ins.vehicleId, reminderType: 'INSURANCE', title, isActive: true },
      });
      if (existing) continue;

      await prisma.reminder.create({
        data: {
          vehicleId:      ins.vehicleId,
          reminderType:   'INSURANCE',
          title,
          dueDate:        ins.endDate,
          intervalMonths: 12,
        },
      });
      created++;
    }
    if (created > 0) console.log(`✅ Created ${created} missing insurance reminders`);
  } catch (e) {
    console.error('Insurance reminder migration failed:', e.message);
  }
}

export default app;

