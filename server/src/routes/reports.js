import { Router } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const serviceTypeLabels = {
  OIL: 'Oil Change', BRAKES: 'Brakes', TIRES: 'Tires', BATTERY: 'Battery',
  TEST: 'Annual Test', AC: 'AC Service', TIMING_BELT: 'Timing Belt',
  FILTERS: 'Filters', SUSPENSION: 'Suspension', ELECTRICAL: 'Electrical',
  BODY_WORK: 'Body Work', GENERAL: 'General', OTHER: 'Other',
};

const expenseCategoryLabels = {
  FUEL: 'Fuel', PARKING: 'Parking', FINE: 'Fine', INSURANCE: 'Insurance',
  LICENSE: 'License', TOLL: 'Toll', WASH: 'Car Wash', ACCESSORIES: 'Accessories', OTHER: 'Other',
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB');
}

function drawHRule(doc, y) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
}

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

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${vehicle.licensePlate}.pdf"`);
    doc.pipe(res);

    // ── Header banner ──────────────────────────────────
    doc.rect(0, 0, 595, 100).fill('#4f46e5');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text('Car Service Tracker', 50, 28);
    doc.fontSize(12).font('Helvetica')
      .text('Vehicle History Report', 50, 55);
    doc.fontSize(10)
      .text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 400, 42, { align: 'right', width: 145 });

    doc.fillColor('#1e293b');
    doc.y = 120;

    // ── Vehicle info ───────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5')
      .text('Vehicle Information', 50);
    doc.moveDown(0.4);
    drawHRule(doc, doc.y);
    doc.moveDown(0.4);

    const col1x = 50, col2x = 300;
    const infoRows = [
      [['Manufacturer', vehicle.manufacturer], ['Model', vehicle.model]],
      [['Year', vehicle.year], ['License Plate', vehicle.licensePlate]],
      [['Color', vehicle.color || '-'], ['Fuel Type', vehicle.fuelType || '-']],
      [['VIN', vehicle.vin || '-'], ['Current Mileage', vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : '-']],
      [['Annual Test Expiry', formatDate(vehicle.testExpiry)], ['First Registered', vehicle.firstRegistered || '-']],
    ];

    doc.font('Helvetica').fontSize(10).fillColor('#1e293b');
    infoRows.forEach(([left, right]) => {
      const y = doc.y;
      doc.font('Helvetica-Bold').text(`${left[0]}:`, col1x, y, { continued: true })
        .font('Helvetica').text(` ${left[1]}`, { width: 200 });
      doc.font('Helvetica-Bold').text(`${right[0]}:`, col2x, y, { continued: true })
        .font('Helvetica').text(` ${right[1]}`);
      doc.moveDown(0.3);
    });

    doc.moveDown(0.8);

    // ── Service history ────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5')
      .text(`Service History (${vehicle.services.length} records)`, 50);
    doc.moveDown(0.4);
    drawHRule(doc, doc.y);
    doc.moveDown(0.4);

    if (vehicle.services.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('No service records found.');
    } else {
      // Table header
      const cols = [75, 110, 65, 75, 100, 120];
      const headers = ['Date', 'Type', 'Cost (ILS)', 'Mileage', 'Garage', 'Notes'];
      const startX = 50;

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
      doc.rect(50, doc.y, 495, 18).fill('#4f46e5');
      const headerY = doc.y + 4;
      headers.forEach((h, i) => {
        const x = startX + cols.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x + 3, headerY, { width: cols[i] - 3 });
      });
      doc.moveDown(0.1);
      doc.y += 6;

      doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      vehicle.services.forEach((s, idx) => {
        if (doc.y > 720) { doc.addPage(); }
        const y = doc.y;
        if (idx % 2 === 0) doc.rect(50, y - 2, 495, 16).fill('#f8fafc');
        doc.fillColor('#1e293b');
        const row = [
          formatDate(s.date),
          serviceTypeLabels[s.serviceType] || s.serviceType,
          Number(s.cost).toLocaleString(),
          s.mileage ? s.mileage.toLocaleString() : '-',
          s.garage?.name || '-',
          (s.description || '-').substring(0, 25),
        ];
        row.forEach((cell, i) => {
          const x = startX + cols.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, x + 3, y, { width: cols[i] - 3 });
        });
        doc.moveDown(0.15);
        doc.y += 3;
      });

      const totalService = vehicle.services.reduce((sum, s) => sum + Number(s.cost), 0);
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#4f46e5')
        .text(`Total Service Cost: ${totalService.toLocaleString()} ILS`, { align: 'right' });
    }

    doc.moveDown(1);

    // ── Expenses summary ───────────────────────────────
    if (vehicle.expenses.length > 0) {
      if (doc.y > 650) doc.addPage();

      doc.font('Helvetica-Bold').fontSize(14).fillColor('#4f46e5')
        .text(`Expenses Summary (${vehicle.expenses.length} records)`, 50);
      doc.moveDown(0.4);
      drawHRule(doc, doc.y);
      doc.moveDown(0.4);

      const byCategory = {};
      vehicle.expenses.forEach(e => {
        const cat = expenseCategoryLabels[e.category] || e.category;
        byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount);
      });

      doc.font('Helvetica').fontSize(10).fillColor('#1e293b');
      Object.entries(byCategory).forEach(([cat, total]) => {
        doc.text(`${cat}:`, 50, doc.y, { continued: true, width: 200 })
          .text(`${total.toLocaleString()} ILS`, { align: 'left' });
        doc.moveDown(0.3);
      });

      const totalExp = Object.values(byCategory).reduce((a, b) => a + b, 0);
      const totalAll = totalExp + vehicle.services.reduce((sum, s) => sum + Number(s.cost), 0);
      doc.moveDown(0.3);
      drawHRule(doc, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#4f46e5')
        .text(`Total Expenses: ${totalExp.toLocaleString()} ILS`, { align: 'right' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#1e293b')
        .text(`Grand Total (Services + Expenses): ${totalAll.toLocaleString()} ILS`, { align: 'right' });
    }

    // ── Footer on all pages ────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94a3b8')
        .text(`Car Service Tracker  ·  Page ${i + 1} of ${pages.count}  ·  ${vehicle.licensePlate}`,
          50, 820, { align: 'center', width: 495 });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

export default router;
