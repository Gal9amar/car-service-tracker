import { schedule } from '@netlify/functions';
import { checkInsuranceExpiry } from '../../server/src/services/reminderCron.js';

// Insurance expiry (30/7 days) — staggered to 05:05 UTC
export const handler = schedule('5 5 * * *', async () => {
  await checkInsuranceExpiry();
  return { statusCode: 200 };
});
