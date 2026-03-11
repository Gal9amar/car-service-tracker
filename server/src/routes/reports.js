import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const serviceTypeLabels = {
  OIL: 'החלפת שמן', BRAKES: 'בלמים', TIRES: 'צמיגים', BATTERY: 'מצבר',
  TEST: 'טסט שנתי', AC: 'מיזוג אוויר', TIMING_BELT: 'רצועת טיימינג',
  FILTERS: 'פילטרים', SUSPENSION: 'מתלים', ELECTRICAL: 'חשמל',
  BODY_WORK: 'פחחות', GENERAL: 'כללי', OTHER: 'אחר',
};

const expenseCategoryLabels = {
  FUEL: 'דלק', PARKING: 'חניה', FINE: 'דוח', INSURANCE: 'ביטוח',
  LICENSE: 'רישיון', TOLL: 'אגרה', WASH: 'שטיפה', ACCESSORIES: 'אביזרים', OTHER: 'אחר',
};

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(n) {
  return Number(n).toLocaleString('he-IL') + ' ₪';
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

    const totalServices = vehicle.services.reduce((sum, s) => sum + Number(s.cost), 0);
    const totalExpenses = vehicle.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const grandTotal = totalServices + totalExpenses;

    const serviceRows = vehicle.services.map(s => `
      <tr>
        <td>${formatDate(s.date)}</td>
        <td>${serviceTypeLabels[s.serviceType] || s.serviceType}</td>
        <td>${formatCurrency(s.cost)}</td>
        <td>${s.mileage ? s.mileage.toLocaleString('he-IL') + ' ק״מ' : '-'}</td>
        <td>${s.garage?.name || '-'}</td>
        <td>${s.description || '-'}</td>
      </tr>
    `).join('');

    const expenseRows = vehicle.expenses.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${expenseCategoryLabels[e.category] || e.category}</td>
        <td>${formatCurrency(e.amount)}</td>
        <td colspan="3">${e.description || '-'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>דוח רכב — ${vehicle.manufacturer} ${vehicle.model} (${vehicle.licensePlate})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      direction: rtl;
      color: #1e293b;
      background: #fff;
      padding: 32px;
      font-size: 14px;
    }
    .header {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border-radius: 16px;
      padding: 28px 32px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { font-size: 22px; font-weight: 800; }
    .header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
    .header .plate {
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      padding: 8px 18px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;
      direction: ltr;
    }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #4f46e5;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .info-item { background: #f8fafc; border-radius: 10px; padding: 12px 14px; }
    .info-item .label { font-size: 11px; color: #64748b; margin-bottom: 3px; }
    .info-item .value { font-weight: 600; font-size: 14px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead tr { background: #4f46e5; color: white; }
    thead th { padding: 10px 12px; text-align: right; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #ede9fe; }
    td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
    .total-row td {
      font-weight: 700;
      background: #ede9fe;
      color: #4f46e5;
      font-size: 14px;
      border-top: 2px solid #c7d2fe;
    }
    .grand-total {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      border-radius: 12px;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
    }
    .grand-total .label { font-size: 15px; opacity: 0.9; }
    .grand-total .amount { font-size: 24px; font-weight: 800; }
    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }
    .print-btn {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 14px 28px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(79,70,229,0.4);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .print-btn:hover { background: #4338ca; }
    @media print {
      .print-btn { display: none; }
      body { padding: 16px; }
      .header { border-radius: 8px; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1>🚗 ${vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}`}</h1>
      <p>${vehicle.manufacturer} ${vehicle.model} · ${vehicle.year} · ${vehicle.color || ''}</p>
      <p style="margin-top:6px;font-size:12px;opacity:0.7;">דוח הופק ב-${formatDate(new Date())}</p>
    </div>
    <div class="plate">${vehicle.licensePlate}</div>
  </div>

  <!-- פרטי רכב -->
  <div class="section">
    <div class="section-title">פרטי הרכב</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">יצרן</div><div class="value">${vehicle.manufacturer || '-'}</div></div>
      <div class="info-item"><div class="label">דגם</div><div class="value">${vehicle.model || '-'}</div></div>
      <div class="info-item"><div class="label">שנה</div><div class="value">${vehicle.year || '-'}</div></div>
      <div class="info-item"><div class="label">צבע</div><div class="value">${vehicle.color || '-'}</div></div>
      <div class="info-item"><div class="label">סוג דלק</div><div class="value">${vehicle.fuelType || '-'}</div></div>
      <div class="info-item"><div class="label">קילומטראז׳</div><div class="value">${vehicle.currentMileage ? vehicle.currentMileage.toLocaleString('he-IL') + ' ק״מ' : '-'}</div></div>
      <div class="info-item"><div class="label">תאריך טסט</div><div class="value">${formatDate(vehicle.testExpiry)}</div></div>
      <div class="info-item"><div class="label">מספר שלדה</div><div class="value">${vehicle.vin || '-'}</div></div>
      <div class="info-item"><div class="label">עלייה לכביש</div><div class="value">${vehicle.firstRegistered || '-'}</div></div>
    </div>
  </div>

  <!-- טיפולים -->
  <div class="section">
    <div class="section-title">היסטוריית טיפולים (${vehicle.services.length})</div>
    ${vehicle.services.length === 0 ? '<p style="color:#94a3b8">אין טיפולים רשומים</p>' : `
    <table>
      <thead>
        <tr>
          <th>תאריך</th><th>סוג טיפול</th><th>עלות</th><th>קילומטראז׳</th><th>מוסך</th><th>הערות</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows}
        <tr class="total-row">
          <td colspan="2">סה״כ טיפולים</td>
          <td>${formatCurrency(totalServices)}</td>
          <td colspan="3"></td>
        </tr>
      </tbody>
    </table>
    `}
  </div>

  <!-- הוצאות -->
  <div class="section">
    <div class="section-title">הוצאות (${vehicle.expenses.length})</div>
    ${vehicle.expenses.length === 0 ? '<p style="color:#94a3b8">אין הוצאות רשומות</p>' : `
    <table>
      <thead>
        <tr>
          <th>תאריך</th><th>קטגוריה</th><th>סכום</th><th colspan="3">הערות</th>
        </tr>
      </thead>
      <tbody>
        ${expenseRows}
        <tr class="total-row">
          <td colspan="2">סה״כ הוצאות</td>
          <td>${formatCurrency(totalExpenses)}</td>
          <td colspan="3"></td>
        </tr>
      </tbody>
    </table>
    `}
  </div>

  <!-- סה"כ כולל -->
  <div class="grand-total">
    <span class="label">סה״כ כולל (טיפולים + הוצאות)</span>
    <span class="amount">${formatCurrency(grandTotal)}</span>
  </div>

  <div class="footer">Car Service Tracker · מעקב טיפולים לרכב · ${vehicle.licensePlate}</div>

  <button class="print-btn" onclick="window.print()">🖨️ הדפס / שמור PDF</button>

</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
