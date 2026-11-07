import { schedule } from '@netlify/functions';
import {
  checkAndSendReminders,
  checkInsuranceExpiry,
  checkTestExpiry30Days,
  checkTestExpiredToday,
} from '../../server/src/services/reminderCron.js';

// Runs daily at 08:00 Israel time (05:00 UTC)
// Each job is isolated so one failure doesn't block the others.
export const handler = schedule('0 5 * * *', async () => {
  for (const job of [checkAndSendReminders, checkInsuranceExpiry, checkTestExpiry30Days, checkTestExpiredToday]) {
    try { await job(); } catch (e) { console.error(`❌ ${job.name} failed:`, e.message); }
  }
  return { statusCode: 200 };
});
