# CLAUDE.md – אפיון פרויקט Car Service Tracker

## מה הפרויקט

אפליקציה לניהול תחזוקה והוצאות רכבים.
בעלים: גל | ממשק בעברית/RTL | פרויקט ישראלי

**פיצ'רים מרכזיים:**
- זיהוי רכב אוטומטי לפי מספר לוחית (API data.gov.il – 4+ מיליון רכבים)
- מעקב היסטוריית טיפולים (13 סוגים)
- ניהול הוצאות לפי קטגוריות (9 קטגוריות)
- תזכורות חכמות (תאריך + קילומטראז')
- ניהול ביטוחים (חובה / צד ג' / מקיף)
- מעקב תוקף טסט
- שליחת מיילים (Resend)
- ייצוא PDF היסטוריית רכב
- Dark Mode + RTL

**URL:** https://carhistory1.netlify.app
**Repo:** Gal9amar/car-service-tracker

---

## מבנה קבצים

```
car-service-tracker/
├── package.json               ← root: concurrently server + client + libsql/pg deps
├── netlify.toml               ← הגדרות Netlify (build, functions, redirects)
├── netlify/
│   └── functions/
│       ├── api.js             ← serverless-http wrapper for Express app
│       ├── cron-reminders.js  ← Netlify Scheduled Function (מחליף node-cron)
│       └── package.json       ← { "type": "module" }
├── client/                    ← React 18 + Vite (פורט 5173)
│   ├── index.html
│   ├── vite.config.js         ← proxy /api → localhost:3000
│   ├── tailwind.config.js     ← indigo brand, dark mode class
│   ├── public/                ← PWA assets (manifest.json, icons)
│   └── src/
│       ├── main.jsx           ← entry + dark mode setup
│       ├── App.jsx            ← router + protected routes
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx      ← grid כרטיסי רכב
│       │   ├── VehiclesPage.jsx       ← רשימת רכבים
│       │   ├── AddVehiclePage.jsx     ← lookup + הוספת רכב
│       │   ├── VehicleDetailPage.jsx  ← 6 טאבים: טיפולים/הוצאות/תזכורות/ביטוחים/טסט/פרטים
│       │   └── SettingsPage.jsx       ← פרופיל + dark mode
│       ├── components/layout/Layout.jsx
│       ├── context/AuthContext.jsx    ← JWT state
│       ├── services/api.js            ← כל ה-API calls
│       └── utils/constants.js         ← SERVICE_TYPES, EXPENSE_CATEGORIES
└── server/                    ← Node.js + Express (פורט 3000 בפיתוח)
    ├── package.json
    ├── .env                   ← TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, JWT_SECRET, ...
    ├── src/
    │   ├── app.js             ← entry + route registration (ללא static serving)
    │   ├── routes/
    │   │   ├── auth.js        ← register/login/logout/me
    │   │   ├── vehicles.js    ← CRUD + gov data refresh
    │   │   ├── services.js    ← CRUD + mileage auto-update
    │   │   ├── expenses.js    ← CRUD + summary stats
    │   │   ├── reminders.js   ← CRUD
    │   │   ├── insurances.js  ← CRUD + auto-reminders
    │   │   ├── dashboard.js   ← aggregated stats
    │   │   └── reports.js     ← PDF generation
    │   ├── services/
    │   │   ├── emailService.js     ← 7 תבניות מייל
    │   │   ├── reminderCron.js     ← checkAndSendReminders() (מופעל מ-Netlify Scheduled Function)
    │   │   └── vehicleLookup.js    ← data.gov.il integration
    │   ├── middleware/
    │   │   ├── auth.js             ← JWT verification
    │   │   └── errorHandler.js
    │   └── utils/prisma.js         ← Prisma + @prisma/adapter-libsql + @libsql/client
    └── prisma/
        └── schema.prisma           ← SQLite schema (provider = "sqlite", driverAdapters)
```

---

## פריסה (Deploy)

- **Netlify** – פריסה אוטומטית מ-GitHub: `Gal9amar/car-service-tracker`
- Push ל-main → Netlify מתעדכן אוטומטית
- **Database:** Turso (SQLite-as-a-service) – לא מקפיא חשבונות חינמיים

### Build Command (netlify.toml)
```bash
cd server && npm install && npx prisma generate && \
cp -r node_modules netlify_node_modules && \
cd ../client && npm install --include=dev && npm run build && \
cd .. && mv server/netlify_node_modules netlify/functions/node_modules
```

### Publish Directory
`client/dist`

### Functions Directory
`netlify/functions`

### פקודות שימושיות
```bash
npm run dev          # server + client במקביל (root)
npm run db:push      # סינכרון schema עם Turso
npm run db:studio    # Prisma Studio UI (localhost:5555)
```

---

## Tech Stack

| Layer | טכנולוגיה |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS (indigo), Recharts |
| Backend | Node.js, Express, ES Modules |
| Hosting | Netlify (Functions + CDN) |
| Database | Turso (SQLite-as-a-service, libsql protocol) |
| ORM | Prisma 5 + @prisma/adapter-libsql |
| Auth | JWT + bcrypt (httpOnly cookie) |
| Email | Resend SDK |
| PDF | PDFKit |
| Cron | Netlify Scheduled Functions (מחליף node-cron) |
| File Upload | Multer + AWS S3/Cloudflare R2 (אופציונלי) |

---

## Database – Prisma Schema

### הגדרות schema.prisma
```prisma
datasource db {
  provider = "sqlite"
  url      = env("TURSO_DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}
```

### הערות SQLite
- **אין enums** – כל enum הוחלף ב-`String`
- **אין `@db.Date` / `@db.Decimal`** – הוסרו
- **`String[]` → `String @default("[]")`** – JSON string במקום מערך
- `ownershipHistory` ו-`recalls` הם JSON string – לפרסר עם `parseVehicle()`

### מודלים עיקריים

**User** – JWT auth, bcrypt, email verification, Google OAuth (לא פעיל)

**Vehicle** – 50+ שדות:
- קלט משתמש: nickname, currentMileage, imageUrl
- data.gov.il: לוחית, יצרן, דגם, שנה, צבע, דלק, מנוע, VIN, צמיגים, תאריכי טסט, WLTP, בעלויות, recalls

**Service** – 13 סוגים:
`PERIODIC | OIL | BRAKES | TIRES | BATTERY | AC | TIMING_BELT | FILTERS | SUSPENSION | ELECTRICAL | BODY_WORK | GENERAL | OTHER`
- PERIODIC → יוצר תזכורת אוטומטית (שנה)

**Expense** – 9 קטגוריות:
`FUEL | PARKING | FINE | INSURANCE | LICENSE | TOLL | WASH | ACCESSORIES | OTHER`

**Reminder** – 7 סוגים:
`TEST | OIL | INSURANCE | LICENSE | TIRES | BRAKES | CUSTOM`
- תומך תאריך + קילומטראז'
- throttle: `lastNotified` (מניעת כפילויות תוך 24 שעות)

**Insurance** – `MANDATORY | THIRD_PARTY | COMPREHENSIVE`
- יצירה → ביטול ביטוח ישן מאותו סוג → יצירת תזכורת אוטומטית

---

## משתני סביבה

### server/.env (פיתוח מקומי)
```env
TURSO_DATABASE_URL=libsql://car-service-tracker-gal9amar.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
JWT_SECRET=<32+ chars>
RESEND_API_KEY=re_xxxxxxxx
FRONTEND_URL=https://carhistory1.netlify.app
NODE_ENV=development
PORT=3000
```

### Netlify Environment Variables (ייצור)
אותם משתנים, מוגדרים בממשק Netlify → Site settings → Environment variables.
`NODE_ENV=production`

**Email:** כל המיילים עוברים כעת ל-`ga9service@gmail.com` (סביבת פיתוח).
לייצור: לאמת דומיין ב-Resend.

---

## ארכיטקטורת Netlify Functions

### api.js
```js
import serverless from 'serverless-http';
import app from '../../server/src/app.js';
export const handler = serverless(app);
```
- כל קריאות `/api/*` מנותבות מ-Netlify redirect → `/.netlify/functions/api/:splat`

### cron-reminders.js
```js
import { schedule } from '@netlify/functions';
export const handler = schedule('0 5 * * *', async () => { ... });
```
- רץ כל יום ב-05:00 UTC (08:00 ירושלים)
- קורא ל-`checkAndSendReminders()` מ-reminderCron.js

### app.js – מצב ייצור
- `app.set('trust proxy', 1)` – נדרש לrate-limit מאחורי proxy של Netlify
- **אין** `app.listen()` בייצור – serverless-http מטפל בזה
- **אין** `import.meta.url` בקוד – לא עובד ב-esbuild CJS output
- cron + listen נטענים רק ב-`NODE_ENV !== 'production'` (dynamic import)

---

## Logic עיסקי חשוב

### data.gov.il Lookup
- 5 resources במקביל לפי לוחית (WLTP לפי `tozeret_cd + degem_cd + shnat_yitzur`)
- Recalls: פילטר עם `MISPAR_RECHEV` (אותיות גדולות)
- Refresh אוטומטי: כל יום ראשון 03:00 (ירושלים) לרכבים שלא עודכנו 7+ ימים

### Scheduled Functions (Netlify)
- **`0 5 * * *`** (08:00 ירושלים): תזכורות שפגות ב-7 ימים + ביטוח/טסט ב-30 ימים

### מייל – Fire-and-forget
שגיאות מייל לא מכשילות את ה-request.

---

## API Routes

```
GET  /api/health                    → { status: "ok" }
POST /api/auth/register             → JWT cookie
POST /api/auth/login                → JWT cookie
GET  /api/vehicles                  → רשימת רכבים
POST /api/vehicles                  → יצירה + שמירת gov data
GET  /api/vehicles/lookup/:plate    → lookup ללא שמירה
POST /api/vehicles/:id/refresh      → re-fetch gov data
GET  /api/vehicles/:id/pdf          → PDF export
POST /api/services                  → + email + תזכורת אוטומטית
GET  /api/expenses/summary?vehicleId=&months=  → סטטיסטיקות
POST /api/insurances                → + ביטול ישן + תזכורת
GET  /api/dashboard                 → stats כל הרכבים
```

---

## גופן ועיצוב

- **Heebo** (Google Fonts) – עברית/RTL
- צבע brand: **Indigo** (Tailwind)
- Dark mode: `class`-based, נשמר ב-localStorage
- RTL: `dir="rtl"` בכל הממשק

---

## כללים חשובים

1. **אין enum ב-SQLite** – ערכים הם strings, ולידציה דרך Zod בלבד
2. JSON fields (`ownershipHistory`, `recalls`) – תמיד לפרסר עם `parseVehicle()`
3. `app.set('trust proxy', 1)` – חובה לrate-limit ב-Netlify
4. **אין `import.meta.url`** בשום קובץ server-side – לא עובד ב-esbuild
5. Rate limiting: auth routes – 20 requests / 15 דקות
6. CORS: dev → localhost:5173-5177 | prod → FRONTEND_URL
7. Push ל-main → Netlify deploy אוטומטי
8. `external_node_modules` ב-netlify.toml – כל ה-native deps חייבים להופיע שם
