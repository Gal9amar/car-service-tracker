# 🚗 Car Service Tracker — מעקב טיפולים לרכב

מערכת ניהול טיפולים, הוצאות ותזכורות לרכב. בנויה עם React + Node.js + PostgreSQL.

## ✨ פיצ'רים

- **זיהוי רכב אוטומטי** — הזן מספר רכב וקבל את כל הפרטים מ-data.gov.il
- **יומן טיפולים** — תיעוד מלא של כל טיפול עם עלות, מוסך, קילומטראז' וצירופים
- **מעקב הוצאות** — דלק, חניה, דוחות, ביטוח — הכל במקום אחד
- **תזכורות חכמות** — לפי תאריך או קילומטראז' עם התראות במייל
- **חיפוש מוסכים** — מוסכים לפי אזור עם דירוגים וביקורות
- **דוח PDF** — ייצוא היסטוריית רכב מלאה למכירה
- **אימות משתמשים** — Google OAuth + רישום עם אימייל/סיסמה
- **ממשק בעברית** — RTL מלא עם מצב כהה

## 🛠️ סטאק טכנולוגי

| שכבה | טכנולוגיה |
|------|----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (Railway) |
| ORM | Prisma |
| Auth | Passport.js (Google OAuth + Local) |
| PDF | PDFKit |

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
cp .env.example server/.env
# Edit server/.env with your values

# Setup database
cd server
npx prisma migrate dev
cd ..

# Run
npm run dev
```

## 🚂 Deploy ל-Railway

1. צור פרויקט חדש ב-Railway
2. הוסף PostgreSQL plugin
3. חבר את ה-GitHub repo
4. הגדר את ה-Environment Variables (ראה `.env.example`)
5. Railway יבנה וידפלוי אוטומטית

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
│   │   └── services/     # Vehicle lookup, PDF
│   ├── prisma/           # Database schema
│   └── ...
├── railway.toml          # Railway config
└── nixpacks.toml         # Build config
```

## 📡 Vehicle API

המערכת משתמשת ב-API הפתוח של data.gov.il לזיהוי רכבים:

```
POST https://data.gov.il/api/3/action/datastore_search
Body: { "resource_id": "053cea08-09bc-40ec-8f7a-156f0677aff3", "filters": { "mispar_rechev": "1234567" } }
```

חינמי, ללא צורך במפתח API, מכיל מידע על 4+ מיליון רכבים.
