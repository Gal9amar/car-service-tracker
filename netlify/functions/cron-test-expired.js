import { schedule } from '@netlify/functions';
import { checkTestExpiredToday } from '../../server/src/services/reminderCron.js';

// Test expired today — staggered to 05:15 UTC
export const handler = schedule('15 5 * * *', async () => {
  await checkTestExpiredToday();
  return { statusCode: 200 };
});
