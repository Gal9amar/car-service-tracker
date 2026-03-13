# Car Service Tracker — Project Skill

## Quick Reference
- **Repo:** `https://github.com/Gal9amar/car-service-tracker`
- **Production URL:** `https://car-service-tracker.up.railway.app`
- **GitHub Token:** `ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Resend API Key:** `re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Resend allowed email:** `ga9service@gmail.com` (no verified domain — all emails go here)
- **Owner:** Gal (Israel)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express (ESM modules) |
| Database | PostgreSQL via Prisma ORM |
| Hosting | Railway (monorepo) |
| Email | Resend (`onboarding@resend.dev`) |
| Auth | JWT (httpOnly cookie) + bcrypt |
| Gov data | data.gov.il API |

---

## Repository Structure

```
/
├── railway.toml              # Build + deploy config
├── package.json              # Root: postinstall installs both
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/            # All page components
│   │   ├── components/layout/# Layout + navbar
│   │   ├── services/api.js   # All API calls
│   │   ├── utils/constants.js# SERVICE_TYPES, EXPENSE_CATEGORIES, etc.
│   │   ├── context/          # AuthContext
│   │   └── App.jsx           # Router
│   └── public/               # PWA manifest + icons
└── server/
    ├── prisma/schema.prisma  # DB schema
    ├── src/
    │   ├── app.js            # Express entry + route registration
    │   ├── routes/           # auth, vehicles, services, expenses,
    │   │                     # reminders, dashboard, reports, insurances
    │   ├── services/
    │   │   ├── emailService.js    # All email templates + sendEmail()
    │   │   ├── reminderCron.js    # Daily + weekly cron jobs
    │   │   └── vehicleLookup.js   # data.gov.il API calls
    │   ├── middleware/
    │   │   ├── auth.js            # JWT authenticate middleware
    │   │   ├── errorHandler.js    # Global error handler
    │   │   └── passport.js        # Google OAuth (unused currently)
    │   └── utils/prisma.js        # Prisma client singleton
    └── package.json               # start: "node src/app.js"
```

---

## Deployment (Railway)

```toml
# railway.toml
[build]
buildCommand = "cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate"

[deploy]
startCommand = "cd server && npx prisma db push --accept-data-loss && npm start"
```

- `prisma db push --accept-data-loss` runs on every deploy → auto-migrates schema
- `npm start` in server = `node src/app.js`
- Frontend served as static files from `client/dist` in production
- Every `git push main` triggers Railway redeploy automatically

---

## Database Schema (Prisma)

### Models

**User** — auth, name, email, optional Google OAuth

**Vehicle** — full data from data.gov.il (50+ fields):
- User input: `nickname`, `currentMileage`, `imageUrl`
- Main API (`053cea08`): `licensePlate`, `manufacturer`, `model`, `year`, `color`, `fuelType`, `engineModel`, `trim`, `vin`, `frontTire`, `rearTire`, `lastTest`, `testExpiry`, `ownership`, `pollutionLevel`, `firstRegistered`
- Technical API (`56063a99`): `engineNumber`, `testKm`, `structureChange`, `hasGrapam`, `colorChange`, `tireChange`, `origin`
- WLTP API (`142afde2`): `horsePower`, `engineCC`, `weight`, `doors`, `seats`, `bodyType`, `driveType`, `transmission`, `co2`, `nox`, `greenScore`, safety booleans (hasABS, hasStabControl, hasLaneDeparture, etc.)
- JSON strings: `ownershipHistory` (array), `recalls` (array)
- `govDataUpdatedAt` — timestamp of last data.gov.il refresh

**Insurance**
- `insuranceType`: MANDATORY | THIRD_PARTY | COMPREHENSIVE
- `company`, `startDate`, `endDate`, `cost`, `notes`, `isActive`
- On create: marks old insurance of same type as inactive + creates Reminder automatically

**Service**
- `serviceType`: PERIODIC | OIL | BRAKES | TIRES | BATTERY | AC | TIMING_BELT | FILTERS | SUSPENSION | ELECTRICAL | BODY_WORK | GENERAL | OTHER
- `nextServiceMileage` — for PERIODIC type
- On PERIODIC create with `nextServiceMileage`: marks old PERIODIC reminders inactive + creates new reminder (dueDate = serviceDate + 1 year)
- On create/update: updates `vehicle.currentMileage` if mileage > current

**Expense** — category, amount, date, description

**Reminder**
- `reminderType`: TEST | OIL | INSURANCE | LICENSE | TIRES | BRAKES | CUSTOM
- `dueDate`, `dueMileage`, `intervalMonths`, `intervalKm`
- `lastNotified` — throttle field (don't resend within 24h)

**Garage** + **GarageReview** — garage management (partially implemented)

---

## API Routes

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register (no email verification) |
| POST | `/login` | Login → sets JWT cookie |
| POST | `/logout` | Clear cookie |
| GET | `/me` | Current user |
| PUT | `/me` | Update name/avatar |

### Vehicles — `/api/vehicles`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List user's vehicles |
| POST | `/` | Create vehicle (saves ALL gov data fields) |
| GET | `/:id` | Get vehicle with services/expenses/reminders |
| PUT | `/:id` | Update nickname/mileage/imageUrl |
| DELETE | `/:id` | Delete vehicle |
| GET | `/lookup/:plate` | Fetch from data.gov.il (no auth save) |
| POST | `/:id/refresh` | Re-fetch gov data + update DB |

Vehicle GET/list returns `ownershipHistory` and `recalls` as parsed JSON arrays.

### Services — `/api/services`
| Method | Path | Description |
|---|---|---|
| GET | `/?vehicleId=` | List services |
| POST | `/` | Create + email + auto reminder (PERIODIC) + update mileage |
| PUT | `/:id` | Update + update mileage if higher |
| DELETE | `/:id` | Delete |

### Expenses — `/api/expenses`
| Method | Path | Description |
|---|---|---|
| GET | `/?vehicleId=` | List expenses |
| GET | `/summary?vehicleId=&months=` | Aggregated stats |
| POST | `/` | Create |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Reminders — `/api/reminders`
| Method | Path | Description |
|---|---|---|
| GET | `/?vehicleId=&activeOnly=` | List |
| POST | `/` | Create + send confirmation email |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Insurances — `/api/insurances`
| Method | Path | Description |
|---|---|---|
| GET | `/?vehicleId=` | List (active first) |
| POST | `/` | Create + deactivate old same-type + create reminder + email |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

### Dashboard — `/api/dashboard`
Returns aggregated stats for all user vehicles including `lastService` and `nextServiceMileage`.

### Reports — `/api/reports`
- `GET /vehicles/:id/pdf` — Hebrew HTML report (print dialog)

---

## Frontend Pages & Components

### Pages
| File | Route | Description |
|---|---|---|
| `LoginPage.jsx` | `/login` | Login form |
| `RegisterPage.jsx` | `/register` | Register form |
| `DashboardPage.jsx` | `/` | Vehicle cards grid with mileage/test/last service |
| `VehiclesPage.jsx` | `/vehicles` | Vehicle list with edit/delete |
| `AddVehiclePage.jsx` | `/vehicles/add` | Plate lookup + add vehicle form |
| `VehicleDetailPage.jsx` | `/vehicles/:id` | 6 tabs (see below) |
| `SettingsPage.jsx` | `/settings` | User settings + dark mode |

### VehicleDetailPage Tabs
1. **טיפולים** (`ServicesTab`) — CRUD, service type, date, mileage, cost, garage, warranty, nextServiceMileage
2. **הוצאות** (`ExpensesTab`) — CRUD, category, amount, date
3. **תזכורות** (`RemindersTab`) — CRUD, type, dueDate, dueMileage, interval
4. **ביטוחים** (`InsurancesTab`) — CRUD, type (חובה/צד ג/מקיף), company, startDate (endDate = start+1year-1day auto), cost. Active/history sections. Days-left warning badge.
5. **טסט** (`MotTab`) — Read-only: testExpiry status banner, lastTest, testKm. Button to create TEST reminder. Updates via gov data refresh.
6. **פרטים** (`DetailsTab`) — All gov data: basic info, test KM, WLTP specs, emissions, equipment badges, safety tech badges, ownership history timeline, recalls warnings

### Dashboard Vehicle Card
Shows: Israeli license plate + manufacturer/model + year | currentMileage | testExpiry + last service/next service km.

---

## data.gov.il Integration

### Resources Used (all queried in parallel)
| Resource ID | Data | Filter key |
|---|---|---|
| `053cea08-09bc-40ec-8f7a-156f0677aff3` | Main vehicle data | `mispar_rechev` (int) |
| `bb2355dc-9ec7-4f06-9c3f-3344672171da` | Ownership history | `mispar_rechev` (int) |
| `56063a99-8a3e-4ff4-912e-5966c0279bad` | Test KM + changes | `mispar_rechev` (int) |
| `142afde2-6228-49f9-8a29-9b6c3a0cbe40` | WLTP specs | `tozeret_cd` + `degem_cd` + `shnat_yitzur` |
| `36bf1404-0be4-49d2-82dc-2f1ead4a8b93` | Recalls (ריקולים) | `MISPAR_RECHEV` (uppercase, int) |

### Refresh Logic
- **Manual:** `POST /vehicles/:id/refresh` — immediately re-fetches all 5 resources, updates DB
- **Automatic:** Weekly cron (Sunday 03:00 Israel time) refreshes vehicles not updated in 7+ days
- Both paths update `govDataUpdatedAt` timestamp

---

## Email System

### `sendEmail()` behavior
- Uses Resend API with `onboarding@resend.dev` FROM
- **No verified domain** → ALL emails go to `ga9service@gmail.com` (env: `RESEND_ALLOWED_EMAIL`)
- Logs each send: `📧 Email sent to {recipient}: {subject}`
- Fire-and-forget pattern in routes (errors logged, don't fail the request)

### Email Templates (all in `emailService.js`)
| Function | Trigger |
|---|---|
| `buildReminderEmailHtml` | Daily cron — upcoming reminders (7 days) |
| `buildNewReminderEmailHtml` | POST /reminders |
| `buildNewServiceEmailHtml` | POST /services |
| `buildNewVehicleEmailHtml` | POST /vehicles |
| `buildNewInsuranceEmailHtml` | POST /insurances |
| `buildInsuranceExpiryEmailHtml` | Daily cron — 30/7 days before insurance expiry |
| `buildRecallAlertEmailHtml` | Weekly refresh — new recalls detected |

---

## Cron Jobs (reminderCron.js)

All run with `timezone: 'Asia/Jerusalem'`

| Schedule | Function | Description |
|---|---|---|
| Daily 08:00 | `checkAndSendReminders` | Reminders due in next 7 days (not notified in 24h) |
| Daily 08:00 | `checkInsuranceExpiry` | Insurance expiring in ≤30 days |
| Daily 08:00 | `checkTestExpiry30Days` | Test expiring in ≤30 days |
| Sunday 03:00 | `refreshAllVehicleGovData` | Refresh all vehicles not updated in 7 days + recall alert if new recalls |

---

## GitHub API Pattern (for pushing code)

```python
TOKEN = "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# 1. Get SHA
SHA=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/Gal9amar/car-service-tracker/contents/PATH" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")

# 2. Push
CONTENT=$(base64 -w 0 /tmp/file.js)
curl -s -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" \
  "https://api.github.com/repos/Gal9amar/car-service-tracker/contents/PATH" \
  -d "{\"message\":\"feat: ...\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}" | \
  python3 -c "import sys,json; r=json.load(sys.stdin); print('✅' if 'commit' in r else '❌')"
```

Always fetch fresh SHA before pushing. Never reuse an old SHA.

---

## Key Business Logic

### Vehicle Mileage Auto-Update
- Every `POST /services` and `PUT /services/:id` with `mileage` field → updates `vehicle.currentMileage` if new value > current

### PERIODIC Service Flow
1. User adds PERIODIC service with `nextServiceMileage`
2. Server: deactivates old reminders with title containing 'טיפול תקופתי'
3. Server: creates new Reminder: `dueDate = serviceDate + 1 year`, `dueMileage = nextServiceMileage`, `intervalMonths = 12`
4. Sends service confirmation email (mentions next service date)

### Insurance Flow
1. User adds insurance (MANDATORY/THIRD_PARTY/COMPREHENSIVE)
2. Server: deactivates old insurance of same type (`isActive = false`)
3. Server: creates Reminder with `reminderType = INSURANCE`, `dueDate = endDate`, `intervalMonths = 12`
4. Sends insurance confirmation email
5. On startup: `createMissingInsuranceReminders()` creates reminders for existing insurances without one

### Insurance End Date Auto-Calculation
Frontend only: `endDate = startDate + 1 year - 1 day` (e.g., 1/7/25 → 30/6/26). User can override.

---

## Environment Variables (Railway)

| Variable | Value |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway managed) |
| `JWT_SECRET` | Random secret |
| `RESEND_API_KEY` | `re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `RESEND_ALLOWED_EMAIL` | `ga9service@gmail.com` |
| `FRONTEND_URL` | `https://car-service-tracker.up.railway.app` |
| `NODE_ENV` | `production` |
| `PORT` | (set by Railway automatically) |

---

## Important Notes & Known Issues

1. **Resend no verified domain** — all emails go to `ga9service@gmail.com`. To send to real users: verify a domain in Resend dashboard, then remove `RESEND_ALLOWED_EMAIL` env var.

2. **`prisma db push --accept-data-loss`** — needed because ServiceType enum had TEST/INSURANCE removed. Safe to keep permanently as schema changes are always additive now.

3. **JSON fields** — `ownershipHistory` and `recalls` stored as JSON strings in DB. Always parsed before returning from API (`parseVehicle()` helper in vehicles.js).

4. **WLTP query** — unlike other resources, WLTP is filtered by `tozeret_cd + degem_cd + shnat_yitzur` (from main record), not by plate number.

5. **Recalls resource** — uses uppercase `MISPAR_RECHEV` filter key (unlike other resources).

6. **Dark mode** — persisted in localStorage, applied in `main.jsx` on load.

7. **RTL** — app is Hebrew/RTL. Always use `dir="rtl"` on new form containers. All text should be right-aligned.

8. **`registrationNote`** — comes as Int from API, must be cast to `String()` in vehicleLookup.js before saving.

9. **Service cost field** — Prisma returns `Decimal` type. Use `Number(service.cost)` for comparisons/display.

---

## Frontend API Client Pattern

```js
// client/src/services/api.js
import { vehicles, services, expenses, reminders, insurances, dashboard } from '../services/api';

// All return promises, throw Error with Hebrew message on failure
const res = await vehicles.get(id);       // { vehicle: {...} }
const res = await services.create(data);  // { service: {...} }
const res = await insurances.list(vehicleId); // { insurances: [...] }
```

---

## UI Conventions

- **Cards:** `className="card p-5"` (defined in index.css)
- **Primary button:** `className="btn-primary"`
- **Secondary button:** `className="btn-secondary"`
- **Labels:** `className="label"` 
- **Inputs:** `className="input"`
- **Brand color:** indigo-600 (`text-brand-600`, `bg-brand-500`)
- **Dark mode:** `dark:` prefix, toggled via `document.documentElement.classList`
- **Icons:** lucide-react
- **Tabs in VehicleDetailPage:** id-based tab system with `tab` state
- **RTL:** wrap new sections in `dir="rtl"`, labels `text-right block`
- **Loading:** `<Loader2 className="animate-spin" />`
- **Empty state:** `<EmptyState text="" icon="" action="" onAction={} />`

---

## Adding a New Feature Checklist

1. **Schema change?** → Edit `server/prisma/schema.prisma` (no migration needed, `db push` handles it)
2. **New route?** → Create `server/src/routes/newroute.js`, register in `app.js`
3. **New email?** → Add template function to `emailService.js`, call `sendEmail()` in route
4. **New API method?** → Add to `client/src/services/api.js`
5. **New tab in VehicleDetailPage?** → Add to `tabs` array, add `{tab === 'x' && <XTab />}`, implement component above `EmptyState`
6. **Push:** Always fetch fresh SHA → base64 encode → PUT to GitHub API
