import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
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
import { startReminderCron } from './services/reminderCron.js';
import prisma from './utils/prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ============================================
// ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
app.listen(PORT, async () => {
  console.log(`🚗 Car Service Tracker server running on port ${PORT}`);
  startReminderCron();
  await createMissingInsuranceReminders();
});

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

