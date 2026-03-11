// services/reminderCron.js
// Cron job יומי שבודק תזכורות ושולח מיילים

import cron from 'node-cron';
import prisma from '../utils/prisma.js';
import { sendEmail, buildReminderEmailHtml } from './emailService.js';

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

  console.log('⏰ Reminder cron job scheduled (daily at 08:00 Israel time)');
}

// אפשרות להריץ ידנית לבדיקה
export { checkAndSendReminders };
