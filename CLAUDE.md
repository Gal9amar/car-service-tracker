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

**URL:** https://car-service-tracker.up.railway.app
**Repo:** Gal9amar/car-service-tracker

---

## מבנה קבצים

```
car-service-tracker/
├── package.json               ← root: concurrently server + client
├── railway.toml               ← הגדרות Railway
├── .env.example               ← תבנית משתני סביבה
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
└── server/                    ← Node.js + Express (פורט 3000)
    ├── package.json
    ├── src/
    │   ├── app.js             ← entry + route registration
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
    │   │   ├── reminderCron.js     ← cron jobs
    │   │   └── vehicleLookup.js    ← data.gov.il integration
    │   ├── middleware/
    │   │   ├── auth.js             ← JWT verification
    │   │   └── errorHandler.js
    │   └── utils/prisma.js         ← Prisma singleton
    └── prisma/
        └── schema.prisma           ← PostgreSQL schema
```

---

## פריסה (Deploy)

- **Railway** – פריסה אוטומטית מ-GitHub
- Push ל-main → Railway מתעדכן אוטומטית

### Build
```bash
# Client
cd client && npm install && npm run build

# Server
cd server && npm install && npx prisma generate
npx prisma db push --accept-data-loss && npm start
```

### פקודות שימושיות
```bash
npm run dev          # server + client במקביל (root)
npm run db:push      # סינכרון schema עם DB
npm run db:studio    # Prisma Studio UI (localhost:5555)
firebase deploy      # לא רלוונטי לפרויקט זה
```

---

## Tech Stack

| Layer | טכנולוגיה |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS (indigo), Recharts |
| Backend | Node.js, Express, ES Modules |
| Database | PostgreSQL (Railway managed) |
| ORM | Prisma 5 |
| Auth | JWT + bcrypt (httpOnly cookie) |
| Email | Resend SDK |
| PDF | PDFKit |
| Cron | node-cron |
| File Upload | Multer + AWS S3/Cloudflare R2 (אופציונלי) |

---

## Database – Prisma Schema

### מודלים עיקריים

**User** – JWT auth, bcrypt, email verification, Google OAuth (לא פעיל)

**Vehicle** – 50+ שדות:
- קלט משתמש: nickname, currentMileage, imageUrl
- data.gov.il: לוחית, יצרן, דגם, שנה, צבע, דלק, מנוע, VIN, צמיגים, תאריכי טסט, WLTP, בעלויות, recalls
- JSON fields: `ownershipHistory`, `recalls` (parse עם `parseVehicle()`)

**Service** – 13 סוגים:
`PERIODIC | OIL | BRAKES | TIRES | BATTERY | AC | TIMING_BELT | FILTERS | SUSPENSION | ELECTRICAL | BODY_WORK | GENERAL | OTHER`
- PERIODIC → יוצר תזכורת אוטומטית (שנה)

**Expense** – 9 קטגוריות:
`FUEL | PARKING | FINE | INSURANCE | LICENSE | TOLL | WASH | ACCESSORIES | OTHER`
- Amount: `Decimal(10,2)` – יש להמיר עם `Number()` להשוואות

**Reminder** – 7 סוגים:
`TEST | OIL | INSURANCE | LICENSE | TIRES | BRAKES | CUSTOM`
- תומך תאריך + קילומטראז'
- throttle: `lastNotified` (מניעת כפילויות תוך 24 שעות)

**Insurance** – `MANDATORY | THIRD_PARTY | COMPREHENSIVE`
- יצירה → ביטול ביטוח ישן מאותו סוג → יצירת תזכורת אוטומטית

---

## משתני סביבה

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<32+ chars>
RESEND_API_KEY=re_xxxxxxxx
FRONTEND_URL=https://car-service-tracker.up.railway.app
NODE_ENV=production
PORT=3000

# אופציונלי – S3/R2:
S3_BUCKET=car-service-tracker
S3_ACCESS_KEY=xxxx
S3_SECRET_KEY=xxxx
S3_ENDPOINT=https://...
```

**Email:** כל המיילים עוברים כעת ל-`ga9service@gmail.com` (סביבת פיתוח).
לייצור: לאמת דומיין ב-Resend.

---

## Logic עיסקי חשוב

### data.gov.il Lookup
- 5 resources במקביל לפי לוחית (WLTP לפי `tozeret_cd + degem_cd + shnat_yitzur`)
- Recalls: פילטר עם `MISPAR_RECHEV` (אותיות גדולות)
- Refresh אוטומטי: כל יום ראשון 03:00 (ירושלים) לרכבים שלא עודכנו 7+ ימים

### Cron Jobs (Asia/Jerusalem)
- **08:00 יומי:** תזכורות שפגות ב-7 ימים + ביטוח/טסט ב-30 ימים
- **יום א׳ 03:00:** Refresh רכבים + התראות recalls

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
GET  /api/vehicles/:id/pdf          ← PDF export
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

1. **Prisma `db push --accept-data-loss`** נדרש בגלל הסרת enum values – בטוח לשינויים additives
2. JSON fields (`ownershipHistory`, `recalls`) – תמיד לפרסר עם `parseVehicle()`
3. `Decimal(10,2)` בשדות עלות – `Number()` להשוואות
4. Rate limiting: auth routes – 20 requests / 15 דקות
5. CORS: dev → localhost:5173-5177 | prod → FRONTEND_URL
6. Push ל-main → Railway deploy אוטומטי
