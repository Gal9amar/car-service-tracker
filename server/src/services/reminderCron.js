// services/reminderCron.js
import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { sendEmail, buildReminderEmailHtml, buildInsuranceExpiryEmailHtml, buildRecallAlertEmailHtml } from './emailService.js';
import { lookupVehicle } from './vehicleLookup.js';

const DAYS_BEFORE = 7;

// ── Weekly gov data refresh ──────────────────────────────────────────────────
async function refreshAllVehicleGovData() {
  console.log('🔄 Starting weekly gov data refresh...', new Date().toISOString());

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { govDataUpdatedAt: null },
        { govDataUpdatedAt: { lt: oneWeekAgo } },
      ],
    },
    select: { id: true, licensePlate: true },
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
          lastTest:   fresh.lastTest   ? new Date(fresh.lastTest)   : null,
          testExpiry: fresh.testExpiry ? new Date(fresh.testExpiry) : null,
          ownership: fresh.ownership, pollutionLevel: fresh.pollutionLevel,
          testKm: fresh.testKm,
          structureChange: fresh.structureChange ?? false,
          hasGrapam:       fresh.hasGrapam       ?? false,
          colorChange:     fresh.colorChange     ?? false,
          tireChange:      fresh.tireChange      ?? false,
          horsePower: fresh.horsePower, engineCC: fresh.engineCC,
          co2: fresh.co2, greenScore: fresh.greenScore,
          hasABS:                fresh.hasABS               ?? false,
          hasStabControl:        fresh.hasStabControl       ?? false,
          hasLaneDeparture:      fresh.hasLaneDeparture     ?? false,
          hasForwardWarning:     fresh.hasForwardWarning    ?? false,
          hasAutoEmergencyBrake: fresh.hasAutoEmergencyBrake ?? false,
          ownershipHistory: fresh.ownershipHistory ? JSON.stringify(fresh.ownershipHistory) : null,
          recalls:          fresh.recalls          ? JSON.stringify(fresh.recalls)          : null,
          govDataUpdatedAt: new Date(),
        },
      });

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
      await new Promise(r => setTimeout(r, 300));

      // שלח מייל ריקול אם יש ריקולים חדשים
      if (fresh.recalls?.length > 0 && fresh.hasActiveRecall) {
        try {
          const fullVehicle = await prisma.vehicle.findUnique({
            where: { id: v.id },
            include: { user: { select: { email: true, name: true } } },
          });
          const prevRecalls = fullVehicle.recalls ? JSON.parse(fullVehicle.recalls) : [];
          const prevIds = new Set(prevRecalls.map(r => r.id));
          const newRecalls = fresh.recalls.filter(r => !prevIds.has(r.id));

          if (newRecalls.length > 0 && fullVehicle.user?.email) {
            await sendEmail({
              to: fullVehicle.user.email,
              subject: `⚠️ ריקול חדש לרכב שלך: ${fullVehicle.manufacturer} ${fullVehicle.model}`,
              html: buildRecallAlertEmailHtml({ userName: fullVehicle.user.name, vehicle: fullVehicle, recalls: newRecalls }),
            });
            console.log(`📧 Recall alert sent to ${fullVehicle.user.email}`);
          }
        } catch (e) { console.error('Recall email failed:', e.message); }
      }
    } catch (err) {
      console.error(`❌ Failed to refresh vehicle ${v.licensePlate}:`, err.message);
      failed++;
    }
  }

  console.log(`✅ Gov data refresh complete. Refreshed: ${refreshed}, Failed: ${failed}`);
}

// ── Daily reminder check ─────────────────────────────────────────────────────
async function checkAndSendReminders() {
  console.log('📅 Running reminder check...', new Date().toISOString());

  const now   = new Date();
  const soon  = new Date();
  soon.setDate(soon.getDate() + DAYS_BEFORE);

  // 24h ago — למנוע שליחה כפולה באותו יום
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        isActive: true,
        dueDate: { gte: now, lte: soon },          // רק עתידיות בטווח 7 ימים
        OR: [
          { lastNotified: null },
          { lastNotified: { lt: oneDayAgo } },     // לא נשלח ב-24 שעות האחרונות
        ],
      },
      include: {
        vehicle: {
          select: {
            id: true, manufacturer: true, model: true,
            licensePlate: true, currentMileage: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    if (reminders.length === 0) {
      console.log('✅ No upcoming reminders found.');
      return;
    }

    const byUser = {};
    for (const r of reminders) {
      const user = r.vehicle.user;
      if (!user?.email) continue;
      if (!byUser[user.email]) byUser[user.email] = { user, reminders: [] };
      byUser[user.email].reminders.push(r);
    }

    let sent = 0;
    for (const { user, reminders: userReminders } of Object.values(byUser)) {
      try {
        const html = buildReminderEmailHtml({ userName: user.name || '', reminders: userReminders });
        await sendEmail({
          to: user.email,
          subject: `🚗 יש לך ${userReminders.length} תזכורת${userReminders.length !== 1 ? 'ות' : ''} לרכב`,
          html,
        });
        console.log(`📧 Sent reminder email to ${user.email} (${userReminders.length} reminders)`);

        // עדכן lastNotified לכל תזכורת שנשלחה
        await prisma.reminder.updateMany({
          where: { id: { in: userReminders.map(r => r.id) } },
          data: { lastNotified: new Date() },
        });

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

// ── Schedule ─────────────────────────────────────────────────────────────────
export function startReminderCron() {
  cron.schedule('0 8 * * *', checkAndSendReminders,      { timezone: 'Asia/Jerusalem' });
  cron.schedule('0 8 * * *', checkInsuranceExpiry,       { timezone: 'Asia/Jerusalem' });
  cron.schedule('0 8 * * *', checkTestExpiry30Days,      { timezone: 'Asia/Jerusalem' });
  cron.schedule('0 3 * * 0', refreshAllVehicleGovData,   { timezone: 'Asia/Jerusalem' });
  console.log('⏰ All crons scheduled (daily 08:00 + gov refresh Sunday 03:00)');
}

// ── ביטוח: בדיקת פקיעה ───────────────────────────────────────────────────────
async function checkInsuranceExpiry() {
  console.log('🛡️ Checking insurance expiry...', new Date().toISOString());
  const now = new Date();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // שלוף ביטוחים שפגים תוך 30 יום ועדיין פעילים
  const insurances = await prisma.insurance.findMany({
    where: {
      isActive: true,
      endDate: { gte: now, lte: in30 },
    },
    include: {
      vehicle: {
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  for (const ins of insurances) {
    const user = ins.vehicle.user;
    if (!user?.email) continue;

    const daysLeft = Math.ceil((new Date(ins.endDate) - now) / (1000 * 60 * 60 * 24));

    // שלח רק ב-30 ימים ובחזרה ב-7 ימים (throttle לפי יום)
    const shouldSend = daysLeft <= 7 || daysLeft <= 30;
    if (!shouldSend) continue;

    try {
      await sendEmail({
        to: user.email,
        subject: `🛡️ ביטוח פג תוקף בעוד ${daysLeft} ימים — ${ins.vehicle.manufacturer} ${ins.vehicle.model}`,
        html: buildInsuranceExpiryEmailHtml({ userName: user.name, insurance: ins, vehicle: ins.vehicle, daysLeft }),
      });
      console.log(`📧 Insurance expiry sent to ${user.email} (${daysLeft} days left)`);
    } catch (e) { console.error('Insurance expiry email failed:', e.message); }
  }
}

// ── טסט: 30 יום מראש ─────────────────────────────────────────────────────────
async function checkTestExpiry30Days() {
  console.log('🔍 Checking test expiry 30 days...', new Date().toISOString());
  const now  = new Date();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in7  = new Date(Date.now() +  7 * 24 * 60 * 60 * 1000);

  const vehicles = await prisma.vehicle.findMany({
    where: { testExpiry: { gte: now, lte: in30 } },
    include: { user: { select: { email: true, name: true } } },
  });

  for (const v of vehicles) {
    if (!v.user?.email) continue;
    const daysLeft = Math.ceil((new Date(v.testExpiry) - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 30) continue;

    const fmt = d => new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
    const urgent = daysLeft <= 7;
    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/></head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,${urgent?'#dc2626,#b91c1c':'#f59e0b,#d97706'});padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">${urgent?'⚠️':'🔧'}</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">תוקף טסט שנתי פג בעוד ${daysLeft} ימים</h1>
          <p style="margin:6px 0 0;color:${urgent?'#fecaca':'#fef3c7'};font-size:14px;">${v.manufacturer} ${v.model} · ${v.licensePlate}</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#374151;margin:0 0 16px;">שלום ${v.user.name || ''},</p>
          <p style="color:#374151;margin:0 0 20px;">תוקף הטסט השנתי לרכב שלך פג ב-<strong>${fmt(v.testExpiry)}</strong> — בעוד ${daysLeft} ימים.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL||'https://car-service-tracker.up.railway.app'}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">פתח את האפליקציה</a>
          </div>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;"><p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker</p></div>
      </div></body></html>`;

    try {
      await sendEmail({
        to: v.user.email,
        subject: `🔧 טסט שנתי פג בעוד ${daysLeft} ימים — ${v.manufacturer} ${v.model}`,
        html,
      });
      console.log(`📧 Test expiry sent to ${v.user.email} (${daysLeft} days)`);
    } catch (e) { console.error('Test expiry email failed:', e.message); }
  }
}

export { checkAndSendReminders };
