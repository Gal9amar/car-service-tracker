// services/reminderCron.js
// Cron job יומי שבודק תזכורות ושולח מיילים
// Cron job שבועי שמרענן נתוני ממשלה לכל הרכבים

import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { sendEmail, buildReminderEmailHtml } from './emailService.js';
import { lookupVehicle } from './vehicleLookup.js';

// כמה ימים מראש לשלוח התראה
const DAYS_BEFORE = 7;

// ── Weekly gov data refresh ─────────────────────────────────────────────────
async function refreshAllVehicleGovData() {
  console.log('🔄 Starting weekly gov data refresh...', new Date().toISOString());

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // רק רכבים שלא עודכנו בשבוע האחרון
  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { govDataUpdatedAt: null },
        { govDataUpdatedAt: { lt: oneWeekAgo } },
      ],
    },
    select: { id: true, licensePlate: true, testExpiry: true },
  });

  console.log(`🚗 Found ${vehicles.length} vehicles to refresh`);
  let refreshed = 0, failed = 0;

  for (const v of vehicles) {
    try {
      const fresh = await lookupVehicle(v.licensePlate);
      if (!fresh) { failed++; continue; }

      await prisma.vehicle.update({
        where: { id: v.id },
        data: {
          color: fresh.color, fuelType: fresh.fuelType,
          lastTest: fresh.lastTest   ? new Date(fresh.lastTest)   : null,
          testExpiry: fresh.testExpiry ? new Date(fresh.testExpiry) : null,
          ownership: fresh.ownership, pollutionLevel: fresh.pollutionLevel,
          testKm: fresh.testKm, structureChange: fresh.structureChange ?? false,
          hasGrapam: fresh.hasGrapam ?? false, colorChange: fresh.colorChange ?? false,
          tireChange: fresh.tireChange ?? false, horsePower: fresh.horsePower,
          engineCC: fresh.engineCC, co2: fresh.co2, greenScore: fresh.greenScore,
          hasABS: fresh.hasABS ?? false, hasStabControl: fresh.hasStabControl ?? false,
          hasLaneDeparture: fresh.hasLaneDeparture ?? false,
          hasForwardWarning: fresh.hasForwardWarning ?? false,
          hasAutoEmergencyBrake: fresh.hasAutoEmergencyBrake ?? false,
          ownershipHistory: fresh.ownershipHistory ? JSON.stringify(fresh.ownershipHistory) : null,
          recalls: fresh.recalls ? JSON.stringify(fresh.recalls) : null,
          govDataUpdatedAt: new Date(),
        },
      });

      // עדכן תזכורת טסט אם תאריך השתנה
      if (fresh.testExpiry) {
        const reminder = await prisma.reminder.findFirst({
          where: { vehicleId: v.id, reminderType: 'TEST' },
        });
        if (reminder) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { dueDate: new Date(fresh.testExpiry) },
          });
        }
      }

      refreshed++;
      // עיכוב קצר כדי לא להציף את ה-API
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`❌ Failed to refresh vehicle ${v.licensePlate}:`, err.message);
      failed++;
    }
  }

  console.log(`✅ Gov data refresh complete. Refreshed: ${refreshed}, Failed: ${failed}`);
}


// כמה ימים מראש לשלוח התראה
const DAYS_BEFORE = 7;

async function checkAndSendReminders() {
  console.log('📅 Running reminder check...', new Date().toISOString());

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + DAYS_BEFORE);

  try {
    // שלוף תזכורות שפג תוקפן או מתקרבות תוך 7 ימים
    const reminders = await prisma.reminder.findMany({
      where: {
        isActive: true,
        dueDate: { lte: soon },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            licensePlate: true,
            currentMileage: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    if (reminders.length === 0) {
      console.log('✅ No upcoming reminders found.');
      return;
    }

    // קבץ לפי משתמש
    const byUser = {};
    for (const r of reminders) {
      const user = r.vehicle.user;
      if (!user?.email) continue;
      if (!byUser[user.email]) {
        byUser[user.email] = { user, reminders: [] };
      }
      byUser[user.email].reminders.push(r);
    }

    // שלח מייל לכל משתמש
    let sent = 0;
    for (const { user, reminders: userReminders } of Object.values(byUser)) {
      try {
        const html = buildReminderEmailHtml({
          userName: user.name || '',
          reminders: userReminders,
        });

        await sendEmail({
          to: user.email,
          subject: `🚗 יש לך ${userReminders.length} תזכורת${userReminders.length !== 1 ? 'ות' : ''} לרכב`,
          html,
        });

        console.log(`📧 Sent reminder email to ${user.email} (${userReminders.length} reminders)`);
        sent++;
      } catch (err) {
        console.error(`❌ Failed to send to ${user.email}:`, err.message);
      }
    }

    console.log(`✅ Reminder check complete. Sent ${sent} emails.`);
  } catch (err) {
    console.error('❌ Reminder cron error:', err);
  }
}

export function startReminderCron() {
  // כל יום ב-08:00 בבוקר
  cron.schedule('0 8 * * *', checkAndSendReminders, {
    timezone: 'Asia/Jerusalem',
  });

  // כל ראשון ב-03:00 לילה — רענון נתוני ממשלה
  cron.schedule('0 3 * * 0', refreshAllVehicleGovData, {
    timezone: 'Asia/Jerusalem',
  });

  console.log('⏰ Reminder cron scheduled (daily 08:00) + Gov refresh cron (weekly Sunday 03:00)');
}
}

// אפשרות להריץ ידנית לבדיקה
export { checkAndSendReminders };
