# 🚗 Car Service Tracker — מעקב טיפולים לרכב

מערכת ניהול טיפולים, הוצאות ותזכורות לרכב. בנויה עם React + Node.js + Turso (SQLite).

## ✨ פיצ'רים

- **זיהוי רכב אוטומטי** — הזן מספר רכב וקבל את כל הפרטים מ-data.gov.il
- **יומן טיפולים** — תיעוד מלא של כל טיפול עם עלות, מוסך, קילומטראז' וצירופים
- **מעקב הוצאות** — דלק, חניה, דוחות, ביטוח — הכל במקום אחד
- **תזכורות חכמות** — לפי תאריך או קילומטראז' עם התראות במייל
- **דוח PDF** — ייצוא היסטוריית רכב מלאה למכירה
- **אימות משתמשים** — רישום עם אימייל/סיסמה
- **ממשק בעברית** — RTL מלא עם מצב כהה

## 🛠️ סטאק טכנולוגי

| שכבה | טכנולוגיה |
|------|----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express (serverless via Netlify Functions) |
| Database | Turso (SQLite-as-a-service) |
| ORM | Prisma 5 + @prisma/adapter-libsql |
| Auth | JWT + bcrypt (httpOnly cookie) |
| Email | Resend |
| Hosting | Netlify |

## 🚀 התקנה מקומית

```bash
# Clone
git clone https://github.com/Gal9amar/car-service-tracker.git
cd car-service-tracker

# Install dependencies
cd server && npm install
cd ../client && npm install
cd ..

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your Turso credentials

# Setup database
cd server
npx prisma db push
cd ..

# Run
npm run dev
```

## 🌐 Deploy ל-Netlify

1. חבר את ה-GitHub repo ב-netlify.com
2. הגדר את ה-Environment Variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `FRONTEND_URL=https://your-site.netlify.app`
   - `NODE_ENV=production`
3. Netlify יבנה וידפלוי אוטומטית

## 📁 מבנה הפרויקט

```
car-service-tracker/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── context/      # Auth context
│   │   ├── services/     # API calls
│   │   └── utils/        # Helpers
│   └── ...
├── server/               # Node.js backend
│   ├── src/
│   │   ├── routes/       # Express routes
│   │   ├── middleware/    # Auth, errors
│   │   └── services/     # Vehicle lookup, PDF, email, cron
│   ├── prisma/           # Database schema
│   └── ...
└── netlify/
    └── functions/        # Serverless entry point
```

## 📡 Vehicle API

המערכת משתמשת ב-API הפתוח של data.gov.il לזיהוי רכבים:

```
POST https://data.gov.il/api/3/action/datastore_search
Body: { "resource_id": "053cea08-09bc-40ec-8f7a-156f0677aff3", "filters": { "mispar_rechev": "1234567" } }
```

חינמי, ללא צורך במפתח API, מכיל מידע על 4+ מיליון רכבים.
