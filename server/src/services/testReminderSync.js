// services/testReminderSync.js
import prisma from '../utils/prisma.js';
import { lookupVehicle } from './vehicleLookup.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Sync the TEST reminder with a (possibly new) testExpiry.
 * If the new expiry is later than the stored due date (the test was renewed),
 * the reminder is re-armed: lastNotified cleared and isActive set back to true.
 */
export async function syncTestReminder(vehicleId, newExpiry) {
  if (!newExpiry) return;
  const expiry = new Date(newExpiry);
  const reminder = await prisma.reminder.findFirst({ where: { vehicleId, reminderType: 'TEST' } });
  if (!reminder) return;

  const renewed = !reminder.dueDate || expiry.getTime() - new Date(reminder.dueDate).getTime() > DAY_MS;
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: renewed
      ? { dueDate: expiry, lastNotified: null, isActive: true }
      : { dueDate: expiry },
  });
}

/**
 * Fetch fresh test data from data.gov.il, persist it and sync the TEST reminder.
 * Returns the fresh testExpiry (Date | null), or `fallback` if the lookup failed,
 * so callers never alert on stale data when fresh data is available.
 */
export async function refreshTestData(vehicle, fallback = vehicle.testExpiry ?? null) {
  try {
    const fresh = await lookupVehicle(vehicle.licensePlate);
    if (!fresh) return fallback;
    const testExpiry = fresh.testExpiry ? new Date(fresh.testExpiry) : null;
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastTest: fresh.lastTest ? new Date(fresh.lastTest) : null,
        testExpiry,
        testKm: fresh.testKm,
        govDataUpdatedAt: new Date(),
      },
    });
    await syncTestReminder(vehicle.id, testExpiry);
    return testExpiry;
  } catch (err) {
    console.error(`refreshTestData failed for ${vehicle.licensePlate}:`, err.message);
    return fallback;
  }
}
