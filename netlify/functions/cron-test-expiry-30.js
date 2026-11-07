import { schedule } from '@netlify/functions';
import { checkTestExpiry30Days } from '../../server/src/services/reminderCron.js';

// Test expiry in 30 days — staggered to 05:10 UTC
export const handler = schedule('10 5 * * *', async () => {
  await checkTestExpiry30Days();
  return { statusCode: 200 };
});
