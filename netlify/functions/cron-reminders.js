import { schedule } from '@netlify/functions';
import { checkAndSendReminders } from '../../server/src/services/reminderCron.js';

// Runs daily at 08:00 Israel time (05:00 UTC)
export const handler = schedule('0 5 * * *', async () => {
  await checkAndSendReminders();
  return { statusCode: 200 };
});
