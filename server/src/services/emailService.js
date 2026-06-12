// services/emailService.js
// שירות שליחת מיילים דרך Gmail SMTP (nodemailer + App Password)

import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD.replace(/\s/g, ''),
    },
  });
}

export async function sendEmail({ to, subject, html, fromName = 'מעקב רכבים' }) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email');
    return;
  }

  try {
    const info = await createTransporter().sendMail({
      from: `"${fromName}" <${GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject} [${info.messageId}]`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
    throw err;
  }
}

// ─── עיצוב בסיסי משותף ────────────────────────────────────────────────────────

const APP_URL = process.env.FRONTEND_URL || 'https://carhistory1.netlify.app';

function base({ headerIcon, headerTitle, headerSubtitle, headerColor = '#B45309', content, footerNote = '' }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FDF8F3; font-family: 'Heebo', Arial, sans-serif; direction: rtl; }
    @media only screen and (max-width: 600px) {
      .outer-pad { padding: 16px 8px !important; }
      .card-pad { padding: 20px 18px 24px !important; }
      .header-pad { padding: 28px 20px 22px !important; }
      .cta-pad { padding: 0 18px 24px !important; }
      .cta-btn { padding: 13px 28px !important; font-size: 14px !important; }
      .header-icon { width: 60px !important; height: 60px !important; line-height: 60px !important; font-size: 30px !important; }
      .header-title { font-size: 19px !important; }
      td { word-break: break-word; }
    }
  </style>
</head>
<body style="background:#FDF8F3;margin:0;padding:0;font-family:'Heebo',Arial,sans-serif;direction:rtl;">

  <!-- wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" class="outer-pad" style="background:#FDF8F3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- logo bar -->
        <tr>
          <td style="padding-bottom:20px;text-align:center;">
            <span style="font-family:'Heebo',Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;color:#92400E;text-transform:uppercase;">מעקב טיפולים לרכב</span>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(180,83,9,0.10),0 1px 4px rgba(0,0,0,0.06);">

            <!-- header stripe -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="header-pad" style="background:${headerColor};padding:36px 36px 28px;text-align:center;position:relative;">
                  <!-- decorative dots -->
                  <div style="position:absolute;top:16px;left:20px;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);"></div>
                  <div style="position:absolute;top:28px;left:36px;width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.15);"></div>
                  <div style="position:absolute;bottom:20px;right:24px;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.20);"></div>

                  <div class="header-icon" style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:36px;margin-bottom:14px;">${headerIcon}</div>
                  <h1 class="header-title" style="font-family:'Heebo',Arial,sans-serif;font-size:22px;font-weight:800;color:#FFFFFF;margin:0 0 6px;line-height:1.3;">${headerTitle}</h1>
                  ${headerSubtitle ? `<p style="font-family:'Heebo',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.85);margin:0;">${headerSubtitle}</p>` : ''}
                </td>
              </tr>
            </table>

            <!-- body -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="card-pad" style="padding:32px 36px 28px;">
                  ${content}
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="cta-pad" style="padding:0 36px 36px;text-align:center;">
                  <a href="${APP_URL}" class="cta-btn" style="display:inline-block;background:#B45309;color:#FFFFFF;text-decoration:none;font-family:'Heebo',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.5px;width:auto;max-width:260px;">
                    פתח את האפליקציה ←
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 0 8px;text-align:center;">
            <p style="font-family:'Heebo',Arial,sans-serif;font-size:12px;color:#A78040;margin:0 0 4px;">מעקב טיפולים לרכב · שומרים עליך בדרך 🛡️</p>
            ${footerNote ? `<p style="font-family:'Heebo',Arial,sans-serif;font-size:11px;color:#C4A97A;margin:0;">${footerNote}</p>` : ''}
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

// ─── כרטיס נתונים ─────────────────────────────────────────────────────────────

function dataTable(rows) {
  const rowsHtml = rows.map(([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? '#FFFBF5' : '#FFFFFF'};">
      <td style="padding:11px 16px;font-family:'Heebo',Arial,sans-serif;font-size:13px;color:#92400E;font-weight:600;white-space:nowrap;border-bottom:1px solid #FDE8C8;">${label}</td>
      <td style="padding:11px 16px;font-family:'Heebo',Arial,sans-serif;font-size:14px;color:#1C1917;font-weight:500;border-bottom:1px solid #FDE8C8;">${value}</td>
    </tr>`).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1.5px solid #FDE8C8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tbody>${rowsHtml}</tbody>
    </table>`;
}

// ─── greeting ─────────────────────────────────────────────────────────────────

function greeting(userName) {
  return `<p style="font-family:'Heebo',Arial,sans-serif;font-size:16px;color:#1C1917;margin:0 0 20px;line-height:1.6;">שלום ${userName || 'חבר/ה יקר/ה'} 👋</p>`;
}

// ─── badge ────────────────────────────────────────────────────────────────────

function badge(text, color = '#B45309', bg = '#FEF3C7') {
  return `<span style="display:inline-block;background:${bg};color:${color};font-family:'Heebo',Arial,sans-serif;font-size:12px;font-weight:700;padding:3px 12px;border-radius:99px;">${text}</span>`;
}

// ─── infoBox ──────────────────────────────────────────────────────────────────

function infoBox(text, color = '#92400E', bg = '#FFFBEB', border = '#FDE68A') {
  return `
    <div style="background:${bg};border:1.5px solid ${border};border-radius:10px;padding:14px 18px;margin-bottom:24px;">
      <p style="font-family:'Heebo',Arial,sans-serif;font-size:14px;color:${color};margin:0;line-height:1.6;">${text}</p>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// תבניות מייל
// ═══════════════════════════════════════════════════════════════════════════════

// ─── תזכורות יומיות ───────────────────────────────────────────────────────────

export function buildReminderEmailHtml({ userName, reminders }) {
  const rows = reminders.map(r => {
    const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
    const dueDateStr = r.dueDate
      ? new Date(r.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const mileageStr = r.dueMileage ? `${r.dueMileage.toLocaleString('he-IL')} ק״מ` : '';
    const statusBadge = isOverdue
      ? badge('דורש טיפול עכשיו', '#991B1B', '#FEE2E2')
      : badge('בקרוב — אל תשכח', '#92400E', '#FEF3C7');

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #FDE8C8;vertical-align:top;">
          <p style="font-family:'Heebo',Arial,sans-serif;font-size:14px;font-weight:700;color:#1C1917;margin:0 0 4px;">${r.title}</p>
          <p style="font-family:'Heebo',Arial,sans-serif;font-size:12px;color:#78716C;margin:0;">${r.vehicle.manufacturer} ${r.vehicle.model} · ${r.vehicle.licensePlate}</p>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #FDE8C8;vertical-align:top;text-align:left;white-space:nowrap;">
          <p style="font-family:'Heebo',Arial,sans-serif;font-size:13px;color:#57534E;margin:0 0 6px;">${dueDateStr}${dueDateStr && mileageStr ? ' / ' : ''}${mileageStr}</p>
          ${statusBadge}
        </td>
      </tr>`;
  }).join('');

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      רצינו להזכיר לך — הרכב שלך זקוק לתשומת לב בנושאים הבאים.<br/>
      <strong style="color:#92400E;">אתה לא לבד</strong> — אנחנו כאן כדי לוודא שתמיד תהיה בטוח בדרך 🛡️
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1.5px solid #FDE8C8;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#FEF3C7;">
          <th style="padding:11px 16px;text-align:right;font-family:'Heebo',Arial,sans-serif;font-size:12px;font-weight:700;color:#92400E;letter-spacing:0.5px;border-bottom:1.5px solid #FDE8C8;">טיפול נדרש</th>
          <th style="padding:11px 16px;text-align:left;font-family:'Heebo',Arial,sans-serif;font-size:12px;font-weight:700;color:#92400E;letter-spacing:0.5px;border-bottom:1.5px solid #FDE8C8;">מועד</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${infoBox('💡 <strong>טיפ חשוב:</strong> תיעוד קבוע של טיפולים שומר על ערך הרכב ומונע תקלות יקרות בעתיד.')}`;

  return base({
    headerIcon: '🔔',
    headerTitle: `יש לך ${reminders.length} תזכורות לטיפול`,
    headerSubtitle: 'הרכב שלך מחכה לך',
    headerColor: '#B45309',
    content,
  });
}

// ─── תזכורת חדשה ──────────────────────────────────────────────────────────────

export function buildNewReminderEmailHtml({ userName, reminder, vehicle }) {
  const dueDateStr = reminder.dueDate
    ? new Date(reminder.dueDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const mileageStr = reminder.dueMileage
    ? `${Number(reminder.dueMileage).toLocaleString('he-IL')} ק"מ`
    : null;

  const typeLabels = {
    TEST: 'טסט שנתי', OIL: 'החלפת שמן', INSURANCE: 'ביטוח',
    LICENSE: 'רישוי', TIRES: 'צמיגים', BRAKES: 'בלמים', CUSTOM: 'מותאם אישית',
  };

  const rows = [
    ['סוג תזכורת', typeLabels[reminder.reminderType] || reminder.reminderType],
    dueDateStr && ['תאריך יעד', dueDateStr],
    mileageStr && ['קילומטראז\'', mileageStr],
    reminder.intervalMonths && ['חוזרת כל', `${reminder.intervalMonths} חודשים`],
    reminder.intervalKm && ['חוזרת כל', `${Number(reminder.intervalKm).toLocaleString('he-IL')} ק"מ`],
  ].filter(Boolean);

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      הגדרת תזכורת חדשה לרכב שלך — <strong style="color:#92400E;">${vehicle.manufacturer} ${vehicle.model}</strong>.<br/>
      נדאג להזכיר לך בזמן כדי שלא תפספס דבר.
    </p>
    ${dataTable(rows)}
    ${infoBox('✅ <strong>כל הכבוד!</strong> תזכורות קבועות הן הדרך הטובה ביותר לשמור על הרכב במצב מעולה.')}`;

  return base({
    headerIcon: '🔔',
    headerTitle: 'תזכורת חדשה נוצרה',
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: '#0D7377',
    content,
  });
}

// ─── טיפול חדש ────────────────────────────────────────────────────────────────

export function buildNewServiceEmailHtml({ userName, service, vehicle, garage }) {
  const serviceTypeLabels = {
    PERIODIC: 'טיפול תקופתי', OIL: 'החלפת שמן', BRAKES: 'בלמים', TIRES: 'צמיגים',
    BATTERY: 'מצבר', TEST: 'טסט שנתי', AC: 'מיזוג אוויר', TIMING_BELT: 'רצועת טיימינג',
    FILTERS: 'פילטרים', SUSPENSION: 'מתלים', ELECTRICAL: 'חשמל', BODY_WORK: 'פחחות',
    GENERAL: 'טיפול כללי', OTHER: 'אחר',
  };

  const dateStr = new Date(service.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const nextDate = service.nextServiceMileage
    ? (() => { const d = new Date(service.date); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }); })()
    : null;

  const rows = [
    ['סוג טיפול',   serviceTypeLabels[service.serviceType] || service.serviceType],
    ['תאריך',       dateStr],
    service.mileage        && ['קילומטראז\'', `${Number(service.mileage).toLocaleString('he-IL')} ק"מ`],
    service.cost > 0       && ['עלות הטיפול', `₪${Number(service.cost).toLocaleString('he-IL')}`],
    garage?.name           && ['מוסך', garage.name],
    service.description    && ['תיאור', service.description],
    service.warrantyUntil  && ['אחריות עד', new Date(service.warrantyUntil).toLocaleDateString('he-IL')],
    service.nextServiceMileage && ['ק"מ לטיפול הבא', `${Number(service.nextServiceMileage).toLocaleString('he-IL')} ק"מ`],
  ].filter(Boolean);

  const nextBox = nextDate
    ? infoBox(`📅 <strong>תזכורת לטיפול הבא נוצרה אוטומטית</strong> — יעד: ${nextDate}. נשלח לך תזכורת בזמן.`, '#166534', '#F0FDF4', '#BBF7D0')
    : '';

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      טיפול חדש נרשם בהצלחה ל־<strong style="color:#92400E;">${vehicle.manufacturer} ${vehicle.model}</strong>.<br/>
      הרכב שלך בידיים טובות — המשך כך! 💪
    </p>
    ${dataTable(rows)}
    ${nextBox}`;

  return base({
    headerIcon: '🔧',
    headerTitle: 'טיפול נרשם בהצלחה!',
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: '#1D6FA4',
    content,
  });
}

// ─── רכב חדש ──────────────────────────────────────────────────────────────────

export function buildNewVehicleEmailHtml({ userName, vehicle }) {
  const v = vehicle;

  const rows = [
    ['מספר לוחית',    v.licensePlate],
    ['יצרן ודגם',     `${v.manufacturer} ${v.model}`],
    ['שנת ייצור',     v.year],
    v.trim          && ['גימור',           v.trim],
    v.color         && ['צבע',             v.color],
    v.fuelType      && ['סוג דלק',         v.fuelType],
    v.transmission  && ['תיבת הילוכים',    v.transmission],
    v.engineCC      && ['נפח מנוע',        `${v.engineCC} סמ"ק`],
    v.horsePower    && ['כוח סוס',         `${v.horsePower} כ"ס`],
    v.bodyType      && ['סוג מרכב',        v.bodyType],
    v.seats         && ['מושבים',          v.seats],
    v.ownership     && ['בעלות',           v.ownership],
    v.testExpiry    && ['תוקף טסט',        new Date(v.testExpiry).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' })],
    v.currentMileage && ['קילומטראז\'',   `${Number(v.currentMileage).toLocaleString('he-IL')} ק"מ`],
    v.vin           && ['מספר שלדה',       v.vin],
  ].filter(Boolean);

  const recallBox = v.hasActiveRecall
    ? infoBox('⚠️ <strong>שים לב:</strong> נמצאו קריאות שירות (ריקול) פתוחות לרכב זה. כנס לאפליקציה לפרטים נוספים.', '#991B1B', '#FEF2F2', '#FECACA')
    : infoBox('🎉 <strong>ברוך הבא!</strong> הרכב נוסף בהצלחה. כעת תוכל לעקוב אחר כל הטיפולים, ההוצאות והביטוחים במקום אחד.');

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      רכב חדש התווסף לחשבון שלך! מעכשיו אנחנו נשמור עליו יחד.<br/>
      <strong style="color:#92400E;">כל מה שקשור לרכב — במקום אחד.</strong>
    </p>
    ${dataTable(rows)}
    ${recallBox}`;

  return base({
    headerIcon: '🚗',
    headerTitle: 'רכב חדש נוסף!',
    headerSubtitle: `${v.manufacturer} ${v.model} · ${v.licensePlate}`,
    headerColor: '#B45309',
    content,
  });
}

// ─── ביטוח חדש ────────────────────────────────────────────────────────────────

export function buildNewInsuranceEmailHtml({ userName, insurance, vehicle }) {
  const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: 'צד ג\'', COMPREHENSIVE: 'מקיף' };
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  const rows = [
    ['סוג ביטוח',    typeLabel[insurance.insuranceType]],
    ['חברת ביטוח',   insurance.company],
    insurance.policyNumber && ['מספר פוליסה', insurance.policyNumber],
    ['תחילת כיסוי',  fmt(insurance.startDate)],
    ['סיום כיסוי',   fmt(insurance.endDate)],
    insurance.cost && ['פרמיה שנתית', `₪${Number(insurance.cost).toLocaleString('he-IL')}`],
    insurance.notes && ['הערות', insurance.notes],
  ].filter(Boolean);

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      ביטוח חדש נרשם לרכב שלך — <strong style="color:#166534;">${vehicle.manufacturer} ${vehicle.model}</strong>.<br/>
      אתה מכוסה ומוגן. <strong style="color:#166534;">שקט נפשי מובטח 🛡️</strong>
    </p>
    ${dataTable(rows)}
    ${infoBox('💡 נשלח לך תזכורת לפני שהביטוח פג תוקפו — כדי שתמיד תהיה מכוסה.', '#166534', '#F0FDF4', '#BBF7D0')}`;

  return base({
    headerIcon: '🛡️',
    headerTitle: 'ביטוח חדש נוסף',
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: '#166534',
    content,
  });
}

// ─── ביטוח פג תוקף ────────────────────────────────────────────────────────────

export function buildInsuranceExpiryEmailHtml({ userName, insurance, vehicle, daysLeft }) {
  const typeLabel = { MANDATORY: 'חובה', THIRD_PARTY: 'צד ג\'', COMPREHENSIVE: 'מקיף' };
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const urgent = daysLeft <= 7;

  const rows = [
    ['סוג ביטוח',   typeLabel[insurance.insuranceType]],
    ['חברת ביטוח',  insurance.company],
    insurance.policyNumber && ['מספר פוליסה', insurance.policyNumber],
    ['תאריך פקיעה', fmt(insurance.endDate)],
    ['ימים שנותרו', `${daysLeft} ימים`],
  ].filter(Boolean);

  const urgencyBox = urgent
    ? infoBox('🚨 <strong>דחוף!</strong> הביטוח פג בעוד פחות מ-7 ימים. נהיגה ללא ביטוח תקף עלולה לגרור קנסות כבדים וחשיפה כלכלית גדולה.', '#991B1B', '#FEF2F2', '#FECACA')
    : infoBox(`📅 הביטוח פג בעוד <strong>${daysLeft} ימים</strong>. זה הזמן לפנות לחברת הביטוח ולחדש את הפוליסה.`, '#92400E', '#FFFBEB', '#FDE68A');

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      רצינו להזכיר לך שהביטוח של <strong style="color:#92400E;">${vehicle.manufacturer} ${vehicle.model}</strong> עומד לפוג בקרוב.<br/>
      חידוש בזמן שומר עליך ועל כל מי שאיתך בדרך. ❤️
    </p>
    ${dataTable(rows)}
    ${urgencyBox}`;

  return base({
    headerIcon: urgent ? '🚨' : '⏰',
    headerTitle: `הביטוח פג בעוד ${daysLeft} ימים`,
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: urgent ? '#B91C1C' : '#B45309',
    content,
  });
}

// ─── ברוך הבא — רישום ראשוני ──────────────────────────────────────────────────

export function buildWelcomeEmailHtml({ userName }) {
  const features = [
    ['🚗', 'זיהוי רכב אוטומטי', 'הוסף רכב לפי מספר לוחית — הפרטים מגיעים אוטומטית ממשרד הרישוי'],
    ['🔧', 'היסטוריית טיפולים', 'עקוב אחר כל טיפול: שמן, בלמים, צמיגים, טסט ועוד 13 סוגים'],
    ['💰', 'מעקב הוצאות', 'דלק, חניה, ביטוח, קנסות — הכל במקום אחד עם סטטיסטיקות'],
    ['🔔', 'תזכורות חכמות', 'קבל התראה לפי תאריך וקילומטראז׳ לפני שאתה שוכח'],
    ['🛡️', 'ניהול ביטוחים', 'עקוב אחר ביטוח חובה, צד ג׳ ומקיף — עם התראה לפני פקיעה'],
    ['📄', 'ייצוא PDF', 'הפק דוח מלא של היסטוריית הרכב בלחיצה אחת'],
  ];

  const featuresHtml = features.map(([icon, title, desc]) => `
    <tr>
      <td style="padding:10px 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:44px;vertical-align:top;padding-top:2px;">
              <div style="width:36px;height:36px;background:#FEF3C7;border-radius:8px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
            </td>
            <td style="vertical-align:top;padding-right:10px;">
              <p style="font-family:'Heebo',Arial,sans-serif;font-size:14px;font-weight:700;color:#1C1917;margin:0 0 2px;">${title}</p>
              <p style="font-family:'Heebo',Arial,sans-serif;font-size:13px;color:#57534E;margin:0;line-height:1.5;">${desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:2px;"></td></tr>`).join('');

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 24px;line-height:1.7;">
      שמחים שהצטרפת! <strong style="color:#92400E;">מעקב רכבים</strong> הוא הכלי החכם לניהול כל מה שקשור לרכב שלך — טיפולים, הוצאות, ביטוחים ותזכורות — הכל במקום אחד.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #FDE8C8;border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <thead>
        <tr style="background:#FEF3C7;">
          <th style="padding:12px 16px;text-align:right;font-family:'Heebo',Arial,sans-serif;font-size:12px;font-weight:700;color:#92400E;letter-spacing:0.5px;">מה תוכל לעשות באפליקציה</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding:12px 16px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${featuresHtml}
          </table>
        </td></tr>
      </tbody>
    </table>
    ${infoBox('💡 <strong>טיפ ראשון:</strong> התחל בהוספת הרכב שלך — הקלד את מספר הלוחית וכל הפרטים יתמלאו אוטומטית!', '#166534', '#F0FDF4', '#BBF7D0')}`;

  return base({
    headerIcon: '🎉',
    headerTitle: `ברוך הבא, ${userName || ''}!`,
    headerSubtitle: 'אנחנו שמחים שהצטרפת למשפחה',
    headerColor: '#B45309',
    content,
    footerNote: 'קיבלת מייל זה כי נרשמת למעקב רכבים.',
  });
}

// ─── OTP / קוד אימות ──────────────────────────────────────────────────────────

export function buildOtpEmailHtml({ userName, code, expiresMinutes = 10 }) {
  const digits = code.split('').map(d =>
    `<span style="display:inline-block;width:38px;height:48px;line-height:48px;text-align:center;background:#FEF3C7;border:2px solid #FDE68A;border-radius:8px;font-family:'Courier New',monospace;font-size:22px;font-weight:800;color:#92400E;margin:0 2px;">${d}</span>`
  ).join('');

  const content = `
    ${greeting(userName || '')}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:14px;color:#44403C;margin:0 0 20px;line-height:1.6;">
      קיבלנו בקשת כניסה למעקב רכבים.<br/>הזן את הקוד הבא כדי להתחבר:
    </p>
    <div style="text-align:center;margin:24px 0 20px;direction:ltr;white-space:nowrap;">
      ${digits}
    </div>
    ${infoBox(`⏱️ הקוד תקף ל-${expiresMinutes} דקות. אל תשתף אותו עם אחרים.`)}
    ${infoBox('🔒 אם לא ביקשת להתחבר — התעלם ממייל זה.', '#1e40af', '#EFF6FF', '#BFDBFE')}`;

  return base({
    headerIcon: '🔐',
    headerTitle: 'קוד האימות שלך',
    headerSubtitle: 'מעקב רכבים',
    headerColor: '#1D6FA4',
    content,
  });
}

// ─── טסט פג היום ──────────────────────────────────────────────────────────────

export function buildTestExpiredEmailHtml({ userName, vehicle }) {
  const fmt = d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  const rows = [
    ['רכב', `${vehicle.manufacturer} ${vehicle.model}`],
    ['מספר לוחית', vehicle.licensePlate],
    ['תאריך פקיעה', fmt(vehicle.testExpiry)],
  ];

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      הטסט השנתי של <strong style="color:#DC2626;">${vehicle.manufacturer} ${vehicle.model}</strong> פג <strong>היום</strong>.
    </p>
    ${dataTable(rows)}
    ${infoBox('🚨 <strong>חשוב:</strong> נסיעה עם רכב ללא טסט תקף אסורה חוקית ועלולה לגרור קנסות כבדים. יש לקבוע תאריך טסט בהקדם האפשרי.', '#991B1B', '#FEF2F2', '#FECACA')}`;

  return base({
    headerIcon: '⛔',
    headerTitle: 'הטסט השנתי פג היום!',
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: '#DC2626',
    content,
  });
}

// ─── ריקול ────────────────────────────────────────────────────────────────────

export function buildRecallAlertEmailHtml({ userName, vehicle, recalls }) {
  const recallsHtml = recalls.map(rc => `
    <div style="border:1.5px solid #FECACA;border-radius:12px;padding:16px 20px;margin-bottom:12px;background:#FEF2F2;">
      <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;font-weight:700;color:#991B1B;margin:0 0 6px;">${rc.system || 'קריאת שירות'}</p>
      ${rc.description ? `<p style="font-family:'Heebo',Arial,sans-serif;font-size:13px;color:#7F1D1D;margin:0 0 6px;line-height:1.6;">${rc.description}</p>` : ''}
      ${rc.openedDate ? `<p style="font-family:'Heebo',Arial,sans-serif;font-size:12px;color:#B91C1C;margin:0;">📅 נפתח: ${rc.openedDate}</p>` : ''}
    </div>`).join('');

  const content = `
    ${greeting(userName)}
    <p style="font-family:'Heebo',Arial,sans-serif;font-size:15px;color:#44403C;margin:0 0 22px;line-height:1.7;">
      זיהינו <strong style="color:#B91C1C;">${recalls.length} קריאות שירות פתוחות</strong> עבור <strong>${vehicle.manufacturer} ${vehicle.model}</strong>.<br/>
      קריאות שירות הן תיקונים שהיצרן מבצע <strong>בחינם</strong> — חשוב לטפל בהן בהקדם.
    </p>
    ${recallsHtml}
    ${infoBox('🔧 <strong>מה לעשות?</strong> פנה למוסך מורשה של היצרן עם מספר הרכב שלך. התיקון מבוצע ללא עלות.', '#991B1B', '#FEF2F2', '#FECACA')}`;

  return base({
    headerIcon: '⚠️',
    headerTitle: 'התראת קריאת שירות',
    headerSubtitle: `${vehicle.manufacturer} ${vehicle.model} · ${vehicle.licensePlate}`,
    headerColor: '#B91C1C',
    content,
  });
}
