import { schedule } from '@netlify/functions';
import { refreshAllVehicleGovData } from '../../server/src/services/reminderCron.js';

// Runs daily at 03:00 UTC. Only vehicles not refreshed for 7+ days are processed,
// so each vehicle is refreshed weekly. A time budget keeps us under the
// scheduled-function timeout; leftovers are picked up on the next run.
export const handler = schedule('0 3 * * *', async () => {
  await refreshAllVehicleGovData({ maxMs: 20000 });
  return { statusCode: 200 };
});
