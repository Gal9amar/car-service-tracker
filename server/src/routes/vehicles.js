import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { lookupVehicle } from '../services/vehicleLookup.js';
import { sendEmail, buildNewVehicleEmailHtml } from '../services/emailService.js';
import { fetchCarImage } from '../services/carImageService.js';

const router = Router();
router.use(authenticate);

// ── helpers ───────────────────────────────────────────────────────────────
function parseVehicle(v) {
  return {
    ...v,
    ownershipHistory: v.ownershipHistory ? JSON.parse(v.ownershipHistory) : [],
    recalls:          v.recalls          ? JSON.parse(v.recalls)          : [],
  };
}

// GET /api/vehicles/lookup/:plate
router.get('/lookup/:plate', async (req, res, next) => {
  try {
    const result = await lookupVehicle(req.params.plate);
    if (!result) return res.status(404).json({ error: 'Vehicle not found in government database.' });
    res.json({ vehicle: result });
  } catch (err) { next(err); }
});

// GET /api/vehicles
router.get('/', async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { services: true, expenses: true } },
        reminders: {
          where: { isActive: true, dueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { dueDate: 'asc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ vehicles: vehicles.map(parseVehicle) });
  } catch (err) { next(err); }
});

// POST /api/vehicles
const boolOpt  = z.boolean().optional();
const intOpt   = z.number().int().optional().nullable();
const floatOpt = z.number().optional().nullable();
const strOpt   = z.string().optional().nullable();

const createVehicleSchema = z.object({
  // User
  nickname:       strOpt,
  currentMileage: intOpt,
  // Main
  licensePlate:     z.string().min(5).max(10),
  manufacturer:     z.string().min(1),
  manufacturerCode: intOpt,
  model:            z.string().min(1),
  modelCode:        strOpt,
  modelId:          intOpt,
  vehicleType:      strOpt,
  year:             z.number().int().min(1900).max(2030),
  color:            strOpt,
  colorCode:        intOpt,
  fuelType:         strOpt,
  engineModel:      strOpt,
  trim:             strOpt,
  safetyRating:     strOpt,
  pollutionLevel:   intOpt,
  vin:              strOpt,
  frontTire:        strOpt,
  rearTire:         strOpt,
  lastTest:         strOpt,
  testExpiry:       strOpt,
  ownership:        strOpt,
  registrationNote: strOpt,
  firstRegistered:  strOpt,
  // Technical
  engineNumber:       strOpt,
  testKm:             intOpt,
  structureChange:    boolOpt,
  hasGrapam:          boolOpt,
  colorChange:        boolOpt,
  tireChange:         boolOpt,
  firstRegisteredDate: strOpt,
  origin:             strOpt,
  // WLTP
  horsePower:           intOpt,
  engineCC:             intOpt,
  weight:               intOpt,
  doors:                intOpt,
  seats:                intOpt,
  bodyType:             strOpt,
  driveType:            strOpt,
  transmission:         strOpt,
  standardType:         strOpt,
  towingWithBrakes:     intOpt,
  towingWithoutBrakes:  intOpt,
  airbags:              intOpt,
  electricWindows:      intOpt,
  hasAC:                boolOpt,
  hasABS:               boolOpt,
  hasPowerSteering:     boolOpt,
  hasStabControl:       boolOpt,
  hasSunroof:           boolOpt,
  hasAlloyWheels:       boolOpt,
  hasTrunkRack:         boolOpt,
  co2:                  floatOpt,
  co2City:              floatOpt,
  co2Highway:           floatOpt,
  nox:                  floatOpt,
  co:                   floatOpt,
  greenScore:           intOpt,
  hasLaneDeparture:     boolOpt,
  hasForwardWarning:    boolOpt,
  hasBlindSpot:         boolOpt,
  hasAdaptiveCruise:    boolOpt,
  hasPedestrianDetect:  boolOpt,
  hasAutoEmergencyBrake: boolOpt,
  hasRearCamera:        boolOpt,
  hasTirePressure:      boolOpt,
  hasFatigueAlert:      boolOpt,
  safetyScore:          floatOpt,
  hasAutoHighBeam:      boolOpt,
  hasSpeedLimiter:      boolOpt,
  hasAlcoLock:          boolOpt,
  // JSON
  ownershipHistory: z.array(z.any()).optional().nullable(),
  recalls:          z.array(z.any()).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const d = createVehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: req.user.id,
        nickname:       d.nickname,
        currentMileage: d.currentMileage,
        // Main
        licensePlate:     d.licensePlate,
        manufacturer:     d.manufacturer,
        manufacturerCode: d.manufacturerCode,
        model:            d.model,
        modelCode:        d.modelCode,
        modelId:          d.modelId,
        vehicleType:      d.vehicleType,
        year:             d.year,
        color:            d.color,
        colorCode:        d.colorCode,
        fuelType:         d.fuelType,
        engineModel:      d.engineModel,
        trim:             d.trim,
        safetyRating:     d.safetyRating,
        pollutionLevel:   d.pollutionLevel,
        vin:              d.vin,
        frontTire:        d.frontTire,
        rearTire:         d.rearTire,
        lastTest:         d.lastTest   ? new Date(d.lastTest)   : null,
        testExpiry:       d.testExpiry ? new Date(d.testExpiry) : null,
        ownership:        d.ownership,
        registrationNote: d.registrationNote,
        firstRegistered:  d.firstRegistered,
        // Technical
        engineNumber:       d.engineNumber,
        testKm:             d.testKm,
        structureChange:    d.structureChange   ?? false,
        hasGrapam:          d.hasGrapam         ?? false,
        colorChange:        d.colorChange       ?? false,
        tireChange:         d.tireChange        ?? false,
        firstRegisteredDate: d.firstRegisteredDate,
        origin:             d.origin,
        // WLTP
        horsePower:           d.horsePower,
        engineCC:             d.engineCC,
        weight:               d.weight,
        doors:                d.doors,
        seats:                d.seats,
        bodyType:             d.bodyType,
        driveType:            d.driveType,
        transmission:         d.transmission,
        standardType:         d.standardType,
        towingWithBrakes:     d.towingWithBrakes,
        towingWithoutBrakes:  d.towingWithoutBrakes,
        airbags:              d.airbags,
        electricWindows:      d.electricWindows,
        hasAC:                d.hasAC             ?? false,
        hasABS:               d.hasABS            ?? false,
        hasPowerSteering:     d.hasPowerSteering  ?? false,
        hasStabControl:       d.hasStabControl    ?? false,
        hasSunroof:           d.hasSunroof        ?? false,
        hasAlloyWheels:       d.hasAlloyWheels    ?? false,
        hasTrunkRack:         d.hasTrunkRack      ?? false,
        co2:                  d.co2,
        co2City:              d.co2City,
        co2Highway:           d.co2Highway,
        nox:                  d.nox,
        co:                   d.co,
        greenScore:           d.greenScore,
        hasLaneDeparture:     d.hasLaneDeparture     ?? false,
        hasForwardWarning:    d.hasForwardWarning    ?? false,
        hasBlindSpot:         d.hasBlindSpot         ?? false,
        hasAdaptiveCruise:    d.hasAdaptiveCruise    ?? false,
        hasPedestrianDetect:  d.hasPedestrianDetect  ?? false,
        hasAutoEmergencyBrake: d.hasAutoEmergencyBrake ?? false,
        hasRearCamera:        d.hasRearCamera        ?? false,
        hasTirePressure:      d.hasTirePressure      ?? false,
        hasFatigueAlert:      d.hasFatigueAlert      ?? false,
        safetyScore:          d.safetyScore,
        hasAutoHighBeam:      d.hasAutoHighBeam      ?? false,
        hasSpeedLimiter:      d.hasSpeedLimiter      ?? false,
        hasAlcoLock:          d.hasAlcoLock          ?? false,
        ownershipHistory: d.ownershipHistory ? JSON.stringify(d.ownershipHistory) : null,
        recalls:          d.recalls          ? JSON.stringify(d.recalls)          : null,
      },
    });

    // Fetch car image from Wikimedia Commons in background (non-blocking)
    fetchCarImage(d.manufacturer, d.model, d.year, d.color).then(async (imgUrl) => {
      if (imgUrl) {
        await prisma.vehicle.update({ where: { id: vehicle.id }, data: { imageUrl: imgUrl } }).catch(() => {});
      }
    }).catch(() => {});

    if (vehicle.testExpiry) {
      await prisma.reminder.create({
        data: { vehicleId: vehicle.id, reminderType: 'TEST', title: 'טסט שנתי', dueDate: vehicle.testExpiry, intervalMonths: 12 },
      });
    }

    res.status(201).json({ vehicle: parseVehicle(vehicle) });

    // שלח מייל אישור — fire and forget
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { email: true, name: true },
      });
      if (user?.email) {
        const html = buildNewVehicleEmailHtml({ userName: user.name, vehicle: { ...parseVehicle(vehicle), hasActiveRecall: d.recalls?.length > 0 } });
        await sendEmail({
          to: user.email,
          subject: `🚗 רכב חדש נוסף: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.licensePlate})`,
          html,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send new vehicle email:', emailErr.message);
    }
  } catch (err) { next(err); }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        services:  { include: { garage: { select: { id: true, name: true } }, attachments: true }, orderBy: { date: 'desc' }, take: 20 },
        expenses:  { orderBy: { date: 'desc' }, take: 20 },
        reminders: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json({ vehicle: parseVehicle(vehicle) });
  } catch (err) { next(err); }
});

// PUT /api/vehicles/:id  (user-editable fields only)
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });
    const data = z.object({
      currentMileage: intOpt,
      nickname: strOpt,
      imageUrl: z.string().url().optional().nullable(),
    }).parse(req.body);
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json({ vehicle: parseVehicle(vehicle) });
  } catch (err) { next(err); }
});

// POST /api/vehicles/:id/refresh  — re-fetch all gov data and update DB
router.post('/:id/refresh', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });

    const fresh = await lookupVehicle(existing.licensePlate);
    if (!fresh) return res.status(502).json({ error: 'Could not fetch data from government database.' });

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        manufacturer:     fresh.manufacturer,
        manufacturerCode: fresh.manufacturerCode,
        model:            fresh.model,
        modelCode:        fresh.modelCode,
        modelId:          fresh.modelId,
        vehicleType:      fresh.vehicleType,
        color:            fresh.color,
        colorCode:        fresh.colorCode,
        fuelType:         fresh.fuelType,
        engineModel:      fresh.engineModel,
        trim:             fresh.trim,
        safetyRating:     fresh.safetyRating,
        pollutionLevel:   fresh.pollutionLevel,
        vin:              fresh.vin,
        frontTire:        fresh.frontTire,
        rearTire:         fresh.rearTire,
        lastTest:         fresh.lastTest   ? new Date(fresh.lastTest)   : null,
        testExpiry:       fresh.testExpiry ? new Date(fresh.testExpiry) : null,
        ownership:        fresh.ownership,
        registrationNote: fresh.registrationNote,
        firstRegistered:  fresh.firstRegistered,
        engineNumber:       fresh.engineNumber,
        testKm:             fresh.testKm,
        structureChange:    fresh.structureChange   ?? false,
        hasGrapam:          fresh.hasGrapam         ?? false,
        colorChange:        fresh.colorChange       ?? false,
        tireChange:         fresh.tireChange        ?? false,
        firstRegisteredDate: fresh.firstRegisteredDate,
        origin:             fresh.origin,
        horsePower:           fresh.horsePower,
        engineCC:             fresh.engineCC,
        weight:               fresh.weight,
        doors:                fresh.doors,
        seats:                fresh.seats,
        bodyType:             fresh.bodyType,
        driveType:            fresh.driveType,
        transmission:         fresh.transmission,
        standardType:         fresh.standardType,
        towingWithBrakes:     fresh.towingWithBrakes,
        towingWithoutBrakes:  fresh.towingWithoutBrakes,
        airbags:              fresh.airbags,
        electricWindows:      fresh.electricWindows,
        hasAC:                fresh.hasAC             ?? false,
        hasABS:               fresh.hasABS            ?? false,
        hasPowerSteering:     fresh.hasPowerSteering  ?? false,
        hasStabControl:       fresh.hasStabControl    ?? false,
        hasSunroof:           fresh.hasSunroof        ?? false,
        hasAlloyWheels:       fresh.hasAlloyWheels    ?? false,
        hasTrunkRack:         fresh.hasTrunkRack      ?? false,
        co2:                  fresh.co2,
        co2City:              fresh.co2City,
        co2Highway:           fresh.co2Highway,
        nox:                  fresh.nox,
        co:                   fresh.co,
        greenScore:           fresh.greenScore,
        hasLaneDeparture:     fresh.hasLaneDeparture     ?? false,
        hasForwardWarning:    fresh.hasForwardWarning    ?? false,
        hasBlindSpot:         fresh.hasBlindSpot         ?? false,
        hasAdaptiveCruise:    fresh.hasAdaptiveCruise    ?? false,
        hasPedestrianDetect:  fresh.hasPedestrianDetect  ?? false,
        hasAutoEmergencyBrake: fresh.hasAutoEmergencyBrake ?? false,
        hasRearCamera:        fresh.hasRearCamera        ?? false,
        hasTirePressure:      fresh.hasTirePressure      ?? false,
        hasFatigueAlert:      fresh.hasFatigueAlert      ?? false,
        safetyScore:          fresh.safetyScore,
        hasAutoHighBeam:      fresh.hasAutoHighBeam      ?? false,
        hasSpeedLimiter:      fresh.hasSpeedLimiter      ?? false,
        hasAlcoLock:          fresh.hasAlcoLock          ?? false,
        ownershipHistory: fresh.ownershipHistory ? JSON.stringify(fresh.ownershipHistory) : null,
        recalls:          fresh.recalls          ? JSON.stringify(fresh.recalls)          : null,
        govDataUpdatedAt: new Date(),
      },
      include: {
        services:  { include: { garage: { select: { id: true, name: true } }, attachments: true }, orderBy: { date: 'desc' }, take: 20 },
        expenses:  { orderBy: { date: 'desc' }, take: 20 },
        reminders: { orderBy: { dueDate: 'asc' } },
      },
    });

    // Update test reminder if testExpiry changed
    if (updated.testExpiry) {
      const existingReminder = await prisma.reminder.findFirst({
        where: { vehicleId: updated.id, reminderType: 'TEST' },
      });
      if (existingReminder) {
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: { dueDate: updated.testExpiry },
        });
      }
    }

    res.json({ vehicle: parseVehicle(updated), refreshed: true });
  } catch (err) {
    console.error('❌ Refresh error:', err.message, err.stack);
    next(err);
  }
});


// POST /api/vehicles/:id/refresh-image — fetch/re-fetch car image from Wikipedia
router.post('/:id/refresh-image', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    const imgUrl = await fetchCarImage(vehicle.manufacturer, vehicle.model, vehicle.year, vehicle.color);
    if (!imgUrl) return res.json({ imageUrl: null, found: false });

    await prisma.vehicle.update({ where: { id: req.params.id }, data: { imageUrl: imgUrl } });
    res.json({ imageUrl: imgUrl, found: true });
  } catch (err) { next(err); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Vehicle not found.' });
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted.' });
  } catch (err) { next(err); }
});

export default router;
