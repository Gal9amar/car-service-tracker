import { schedule } from '@netlify/functions';
import { checkMonthlySummary } from '../../server/src/services/reminderCron.js';

// Runs on the 1st of each month at 08:00 Israel time (05:00 UTC)
export const handler = schedule('0 5 1 * *', async () => {
  await checkMonthlySummary();
  return { statusCode: 200 };
});
