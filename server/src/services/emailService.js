// services/emailService.js
// שירות שליחת מיילים דרך Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Car Tracker <notifications@cartracker.co.il>';

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
