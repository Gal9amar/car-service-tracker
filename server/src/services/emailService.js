// services/emailService.js
// שירות שליחת מיילים דרך Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Car Tracker <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — skipping email');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('Resend error:', err);
    throw new Error(err.message || 'Failed to send email');
  }

  return res.json();
}

// ─── תבנית מייל תזכורת ───────────────────────────────────────────────────────

export function buildReminderEmailHtml({ userName, reminders }) {
  const reminderRows = reminders.map(r => {
    const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
    const dueDateStr = r.dueDate
      ? new Date(r.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const mileageStr = r.dueMileage ? `${r.dueMileage.toLocaleString('he-IL')} ק״מ` : '';
    const statusColor = isOverdue ? '#ef4444' : '#f59e0b';
    const statusLabel = isOverdue ? 'באיחור!' : 'בקרוב';

    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <strong style="color:#1e293b;">${r.title}</strong><br/>
          <span style="color:#64748b;font-size:13px;">${r.vehicle.manufacturer} ${r.vehicle.model} · ${r.vehicle.licensePlate}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px;">
          ${dueDateStr}${dueDateStr && mileageStr ? ' / ' : ''}${mileageStr}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <span style="background:${statusColor};color:#fff;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;">${statusLabel}</span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 32px 24px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🚗</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">תזכורות לרכב שלך</h1>
          <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">יש לך ${reminders.length} תזכורות תשומת לב</p>
        </div>

        <!-- Content -->
        <div style="padding:24px 32px;">
          <p style="color:#374151;margin:0 0 20px;">שלום ${userName || ''},</p>
          <p style="color:#374151;margin:0 0 20px;">מצאנו תזכורות שמחכות לטיפול:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px 16px;text-align:right;font-size:13px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">טיפול</th>
                <th style="padding:12px 16px;text-align:right;font-size:13px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">מועד</th>
                <th style="padding:12px 16px;text-align:right;font-size:13px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">סטטוס</th>
              </tr>
            </thead>
            <tbody>${reminderRows}</tbody>
          </table>

          <div style="text-align:center;margin-top:28px;">
            <a href="${process.env.FRONTEND_URL || 'https://your-app.railway.app'}" 
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              פתח את האפליקציה
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker · מעקב טיפולים לרכב</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── תבנית מייל הוספת תזכורת חדשה ──────────────────────────────────────────

export function buildNewReminderEmailHtml({ userName, reminder, vehicle }) {
  const dueDateStr = reminder.dueDate
    ? new Date(reminder.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const mileageStr = reminder.dueMileage
    ? `${Number(reminder.dueMileage).toLocaleString('he-IL')} ק"מ`
    : null;

  const whenLines = [
    dueDateStr && `<li style="margin:4px 0;color:#374151;">📅 תאריך: <strong>${dueDateStr}</strong></li>`,
    mileageStr && `<li style="margin:4px 0;color:#374151;">🚗 קילומטראז': <strong>${mileageStr}</strong></li>`,
    reminder.intervalMonths && `<li style="margin:4px 0;color:#374151;">🔁 חוזרת כל: <strong>${reminder.intervalMonths} חודשים</strong></li>`,
    reminder.intervalKm && `<li style="margin:4px 0;color:#374151;">🔁 חוזרת כל: <strong>${Number(reminder.intervalKm).toLocaleString('he-IL')} ק"מ</strong></li>`,
  ].filter(Boolean).join('');

  const typeLabels = {
    TEST: 'טסט שנתי', OIL: 'החלפת שמן', INSURANCE: 'ביטוח',
    LICENSE: 'רישוי', TIRES: 'צמיגים', BRAKES: 'בלמים', CUSTOM: 'מותאם אישית',
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🔔</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">תזכורת חדשה נוספה</h1>
          <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}</p>
        </div>

        <div style="padding:28px 32px;">
          <p style="color:#374151;margin:0 0 20px;">שלום ${userName || ''},</p>
          <p style="color:#374151;margin:0 0 20px;">נוספה תזכורת חדשה לרכב שלך:</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e293b;">
              ${reminder.title}
            </p>
            <p style="margin:0 0 14px;font-size:13px;color:#64748b;">
              סוג: ${typeLabels[reminder.reminderType] || reminder.reminderType}
            </p>
            ${whenLines ? `<ul style="margin:0;padding-right:18px;list-style:none;">${whenLines}</ul>` : ''}
          </div>

          <div style="text-align:center;">
            <a href="${process.env.FRONTEND_URL || 'https://car-service-tracker.up.railway.app'}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              פתח את האפליקציה
            </a>
          </div>
        </div>

        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker · מעקב טיפולים לרכב</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── תבנית מייל הוספת טיפול ─────────────────────────────────────────────────

export function buildNewServiceEmailHtml({ userName, service, vehicle, garage }) {
  const serviceTypeLabels = {
    PERIODIC: 'טיפול תקופתי', OIL: 'החלפת שמן', BRAKES: 'בלמים', TIRES: 'צמיגים',
    BATTERY: 'מצבר', TEST: 'טסט שנתי', AC: 'מיזוג אוויר', TIMING_BELT: 'רצועת תזמון',
    FILTERS: 'פילטרים', SUSPENSION: 'מתלים', ELECTRICAL: 'חשמל', BODY_WORK: 'פחחות',
    GENERAL: 'טיפול כללי', OTHER: 'אחר',
  };

  const dateStr = new Date(service.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const nextServiceDate = service.nextServiceMileage
    ? (() => { const d = new Date(service.date); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); })()
    : null;

  const rows = [
    ['סוג טיפול',   serviceTypeLabels[service.serviceType] || service.serviceType],
    ['תאריך',       dateStr],
    service.mileage        && ['קילומטראז\'', `${Number(service.mileage).toLocaleString('he-IL')} ק"מ`],
    service.cost > 0       && ['עלות', `₪${Number(service.cost).toLocaleString('he-IL')}`],
    garage?.name           && ['מוסך', garage.name],
    service.description    && ['תיאור', service.description],
    service.warrantyUntil  && ['אחריות עד', new Date(service.warrantyUntil).toLocaleDateString('he-IL')],
    service.nextServiceMileage && ['ק"מ לטיפול הבא', `${Number(service.nextServiceMileage).toLocaleString('he-IL')} ק"מ`],
    nextServiceDate        && ['תאריך יעד לטיפול הבא', nextServiceDate],
  ].filter(Boolean);

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:500;">${value}</td>
    </tr>`).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🔧</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">טיפול חדש נרשם</h1>
          <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#374151;margin:0 0 20px;">שלום ${userName || ''},</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>${rowsHtml}</tbody>
          </table>
          ${nextServiceDate ? `
          <div style="margin-top:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
            <p style="margin:0;color:#166534;font-size:14px;">📅 <strong>תזכורת לטיפול הבא נוצרה אוטומטית</strong> ל-${nextServiceDate}</p>
          </div>` : ''}
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL || 'https://car-service-tracker.up.railway.app'}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              פתח את האפליקציה
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker · מעקב טיפולים לרכב</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── תבנית מייל הוספת רכב חדש ───────────────────────────────────────────────

export function buildNewVehicleEmailHtml({ userName, vehicle }) {
  const rows = [
    ['מספר רכב',    vehicle.licensePlate],
    ['יצרן',        vehicle.manufacturer],
    ['דגם',         vehicle.model],
    ['שנת ייצור',   vehicle.year],
    vehicle.color    && ['צבע',    vehicle.color],
    vehicle.fuelType && ['דלק',    vehicle.fuelType],
    vehicle.engineModel && ['מנוע', vehicle.engineModel],
    vehicle.trim     && ['גימור',  vehicle.trim],
    vehicle.vin      && ['שלדה',   vehicle.vin],
    vehicle.testExpiry && ['תוקף רישוי', new Date(vehicle.testExpiry).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' })],
    vehicle.ownership && ['בעלות', vehicle.ownership],
    vehicle.currentMileage && ['קילומטראז\'', `${Number(vehicle.currentMileage).toLocaleString('he-IL')} ק"מ`],
    vehicle.horsePower && ['כוח סוס', `${vehicle.horsePower} כ"ס`],
    vehicle.engineCC   && ['נפח מנוע', `${vehicle.engineCC} סמ"ק`],
    vehicle.hasActiveRecall && ['⚠️ ריקול', 'יש קריאות שירות פתוחות — בדוק בפרטי הרכב'],
  ].filter(Boolean);

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;white-space:nowrap;">${label}</td>
      <td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:500;">${value}</td>
    </tr>`).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
      <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🚗</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">רכב חדש נוסף!</h1>
          <p style="margin:6px 0 0;color:#c7d2fe;font-size:15px;">${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="color:#374151;margin:0 0 20px;">שלום ${userName || ''},</p>
          <p style="color:#374151;margin:0 0 20px;">הרכב הבא נוסף בהצלחה למערכת:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tbody>${rowsHtml}</tbody>
          </table>
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL || 'https://car-service-tracker.up.railway.app'}"
               style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
              פתח את האפליקציה
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker · מעקב טיפולים לרכב</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── ביטוח: הוספה ────────────────────────────────────────────────────────────
export function buildNewInsuranceEmailHtml({ userName, insurance, vehicle }) {
  const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: 'צד ג\'', COMPREHENSIVE: 'מקיף' };
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
  const rows = [
    ['סוג ביטוח',   typeLabel[insurance.insuranceType]],
    ['חברת ביטוח',  insurance.company],
    insurance.policyNumber && ['מספר פוליסה', insurance.policyNumber],
    ['תחילת כיסוי', fmt(insurance.startDate)],
    ['סיום כיסוי',  fmt(insurance.endDate)],
    insurance.cost && ['פרמיה שנתית', `₪${Number(insurance.cost).toLocaleString('he-IL')}`],
    insurance.notes && ['הערות', insurance.notes],
  ].filter(Boolean);
  const rowsHtml = rows.map(([l,v]) => `<tr><td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">${l}</td><td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:500;">${v}</td></tr>`).join('');
  return _insuranceEmail({ title:'ביטוח חדש נוסף', icon:'🛡️', userName, vehicle, rowsHtml, banner:null });
}

// ─── ביטוח: 30 יום ───────────────────────────────────────────────────────────
export function buildInsuranceExpiryEmailHtml({ userName, insurance, vehicle, daysLeft }) {
  const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: 'צד ג\'', COMPREHENSIVE: 'מקיף' };
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
  const urgent = daysLeft <= 7;
  const banner = `<div style="margin-bottom:20px;background:${urgent?'#fef2f2':'#fffbeb'};border:1px solid ${urgent?'#fecaca':'#fde68a'};border-radius:10px;padding:14px 18px;"><p style="margin:0;color:${urgent?'#991b1b':'#92400e'};font-size:14px;">${urgent?'⚠️':'📅'} <strong>הביטוח פג תוקף בעוד ${daysLeft} ימים</strong> — יש לחדש בהקדם</p></div>`;
  const rows = [
    ['סוג ביטוח',  typeLabel[insurance.insuranceType]],
    ['חברת ביטוח', insurance.company],
    insurance.policyNumber && ['מספר פוליסה', insurance.policyNumber],
    ['תאריך פקיעה', fmt(insurance.endDate)],
  ].filter(Boolean);
  const rowsHtml = rows.map(([l,v]) => `<tr><td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;">${l}</td><td style="padding:9px 16px;border-bottom:1px solid #f1f5f9;color:#1e293b;font-size:14px;font-weight:500;">${v}</td></tr>`).join('');
  return _insuranceEmail({ title:`ביטוח פג בעוד ${daysLeft} ימים`, icon: urgent?'⚠️':'🛡️', userName, vehicle, rowsHtml, banner });
}

// ─── ריקול ────────────────────────────────────────────────────────────────────
export function buildRecallAlertEmailHtml({ userName, vehicle, recalls }) {
  const recallsHtml = recalls.map(rc => `
    <div style="border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:12px;background:#fef2f2;">
      <p style="margin:0 0 6px;font-weight:700;color:#991b1b;">${rc.system}</p>
      <p style="margin:0 0 4px;color:#7f1d1d;font-size:13px;">${rc.description}</p>
      ${rc.openedDate ? `<p style="margin:0;color:#b91c1c;font-size:12px;">נפתח: ${rc.openedDate}</p>` : ''}
    </div>`).join('');
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
    <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">⚠️</div>
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">התראת ריקול</h1>
        <p style="margin:6px 0 0;color:#fecaca;font-size:14px;">${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#374151;margin:0 0 16px;">שלום ${userName || ''},</p>
        <p style="color:#374151;margin:0 0 20px;">נמצאו <strong>${recalls.length}</strong> קריאות שירות פתוחות לרכב שלך:</p>
        ${recallsHtml}
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.FRONTEND_URL||'https://car-service-tracker.up.railway.app'}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">פתח את האפליקציה</a>
        </div>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;"><p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker</p></div>
    </div></body></html>`;
}

// ─── helper פנימי ─────────────────────────────────────────────────────────────
function _insuranceEmail({ title, icon, userName, vehicle, rowsHtml, banner }) {
  return `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
    <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">${icon}</div>
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">${title}</h1>
        <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:#374151;margin:0 0 20px;">שלום ${userName || ''},</p>
        ${banner || ''}
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.FRONTEND_URL||'https://car-service-tracker.up.railway.app'}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">פתח את האפליקציה</a>
        </div>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;"><p style="color:#94a3b8;font-size:12px;margin:0;">Car Service Tracker</p></div>
    </div></body></html>`;
}
