import { Router } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Hebrew labels mapping
const serviceTypeLabels = {
  OIL: 'החלפת שמן', BRAKES: 'בלמים', TIRES: 'צמיגים', BATTERY: 'מצבר',
  TEST: 'טסט', AC: 'מיזוג אוויר', TIMING_BELT: 'רצועת טיימינג',
  FILTERS: 'פילטרים', SUSPENSION: 'מתלים', ELECTRICAL: 'חשמל',
  BODY_WORK: 'פחחות', GENERAL: 'כללי', OTHER: 'אחר',
};

const expenseCategoryLabels = {
  FUEL: 'דלק', PARKING: 'חניה', FINE: 'דוח', INSURANCE: 'ביטוח',
  LICENSE: 'רישיון', TOLL: 'אגרה', WASH: 'שטיפה', ACCESSORIES: 'אביזרים', OTHER: 'אחר',
};

// ============================================
// GET /api/reports/vehicles/:id/pdf
// ============================================
router.get('/vehicles/:id/pdf', async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        services: {
          include: { garage: { select: { name: true } } },
          orderBy: { date: 'desc' },
        },
        expenses: { orderBy: { date: 'desc' } },
      },
    });

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vehicle-report-${vehicle.licensePlate}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(24).text('Vehicle History Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`${vehicle.manufacturer} ${vehicle.model} (${vehicle.year})`, { align: 'center' });
    doc.fontSize(12).text(`License Plate: ${vehicle.licensePlate}`, { align: 'center' });
    doc.moveDown(1);

    // Vehicle Details
    doc.fontSize(14).text('Vehicle Details', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    const details = [
      ['Manufacturer', vehicle.manufacturer],
      ['Model', vehicle.model],
      ['Year', vehicle.year],
      ['Color', vehicle.color || 'N/A'],
      ['Fuel Type', vehicle.fuelType || 'N/A'],
      ['VIN', vehicle.vin || 'N/A'],
      ['Trim', vehicle.trim || 'N/A'],
      ['Current Mileage', vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : 'N/A'],
      ['Test Expiry', vehicle.testExpiry ? new Date(vehicle.testExpiry).toLocaleDateString('he-IL') : 'N/A'],
      ['First Registered', vehicle.firstRegistered || 'N/A'],
    ];
    details.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`);
    });
    doc.moveDown(1);

    // Service History
    doc.fontSize(14).text('Service History', { underline: true });
    doc.moveDown(0.3);

    if (vehicle.services.length === 0) {
      doc.fontSize(10).text('No service records.');
    } else {
      // Table header
      doc.fontSize(9);
      const tableTop = doc.y;
      const colWidths = [70, 90, 60, 80, 100, 90];
      const headers = ['Date', 'Type', 'Cost (ILS)', 'Mileage', 'Garage', 'Notes'];

      headers.forEach((h, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.font('Helvetica-Bold').text(h, x, tableTop, { width: colWidths[i] });
      });
      doc.font('Helvetica');
      doc.moveDown(0.5);

      vehicle.services.forEach(service => {
        if (doc.y > 700) {
          doc.addPage();
        }
        const y = doc.y;
        const row = [
          new Date(service.date).toLocaleDateString('he-IL'),
          serviceTypeLabels[service.serviceType] || service.serviceType,
          Number(service.cost).toLocaleString(),
          service.mileage ? service.mileage.toLocaleString() : '-',
          service.garage?.name || '-',
          (service.description || '-').substring(0, 30),
        ];
        row.forEach((cell, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, x, y, { width: colWidths[i] });
        });
        doc.moveDown(0.3);
      });

      // Total cost
      const totalServiceCost = vehicle.services.reduce((sum, s) => sum + Number(s.cost), 0);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`Total Service Cost: ${totalServiceCost.toLocaleString()} ILS`);
      doc.font('Helvetica');
    }

    doc.moveDown(1);

    // Expenses Summary
    if (vehicle.expenses.length > 0) {
      doc.fontSize(14).text('Expenses Summary', { underline: true });
      doc.moveDown(0.3);

      const expenseByCategory = {};
      vehicle.expenses.forEach(e => {
        const cat = expenseCategoryLabels[e.category] || e.category;
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount);
      });

      doc.fontSize(10);
      Object.entries(expenseByCategory).forEach(([cat, total]) => {
        doc.text(`${cat}: ${total.toLocaleString()} ILS`);
      });

      const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`Total Expenses: ${totalExpenses.toLocaleString()} ILS`);
      doc.font('Helvetica');
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).text(
      `Report generated on ${new Date().toLocaleDateString('he-IL')} by Car Service Tracker`,
      { align: 'center', color: '#999' }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;
