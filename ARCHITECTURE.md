# FemFlow — Architecture Document

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Architecture](#backend-architecture)
   - [Server Entry Point](#server-entry-point)
   - [Database Models](#database-models)
   - [API Routes & Controllers](#api-routes--controllers)
   - [Middleware](#middleware)
   - [Utility Modules](#utility-modules)
   - [AI Integration (OpenRouter)](#ai-integration-openrouter)
6. [Frontend Architecture](#frontend-architecture)
   - [App Shell & Routing](#app-shell--routing)
   - [Authentication Flow](#authentication-flow)
   - [Pages](#pages)
   - [API Service Layer](#api-service-layer)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [AI Features Deep Dive](#ai-features-deep-dive)
9. [PCOS Risk Scoring Algorithm](#pcos-risk-scoring-algorithm)
10. [Cycle Prediction Algorithm](#cycle-prediction-algorithm)
11. [Cron Jobs](#cron-jobs)
12. [Security Model](#security-model)
13. [Environment Configuration](#environment-configuration)

---

## System Overview

FemFlow is a full-stack **Period Tracking & PCOS (Polycystic Ovary Syndrome) Management** web application. It enables women to:

- **Track menstrual cycles** — log period start/end dates, flow intensity, and notes
- **Log daily health data** — mood, symptoms, sleep, water intake, exercise, stress, diet, and weight
- **Get AI-powered insights** — motivational lines, cycle phase analysis, body/wellness tips, and personalized health suggestions (via OpenRouter LLM API)
- **Assess PCOS risk** — an algorithmic scoring system (0–100) based on cycle irregularity, symptom frequency, and lifestyle factors
- **Predict next cycles** — statistical prediction of next period, ovulation date, and fertile window
- **Set health reminders** — configurable reminders for period, medication, hydration, exercise, sleep, or custom events
- **Visualize analytics** — charts for cycle length trends, symptom frequency, mood distribution, mood trends, and sleep trends

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                       │
│  Vite + React 19 + React Router 7 + Recharts + Axios           │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Dashboard │ │  Cycles  │ │ DailyLog │ │Analytics │ ...       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       └──────────┬──┴────────────┴────────────┘                 │
│            ┌─────▼──────┐                                       │
│            │ api.js     │  (Axios instance, Bearer token)       │
│            └─────┬──────┘                                       │
└──────────────────┼──────────────────────────────────────────────┘
                   │ HTTP (REST JSON)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVER (Express.js API)                       │
│                                                                  │
│  ┌────────────┐  ┌────────────────────────────────────────┐      │
│  │ Middleware │  │           Route Handlers               │      │
│  │ (JWT Auth) │  │  auth · cycles · logs · analytics ·    │      │
│  └──────┬─────┘  │  reminders                             │      │
│         │        └──────────────┬─────────────────────────┘      │
│         │                      │                                 │
│  ┌──────▼──────────────────────▼──────────────────────┐          │
│  │              Controllers                           │          │
│  │  authController · cycleController · logController  │          │
│  │  analyticsController · reminderController          │          │
│  └──────────────────────┬─────────────────────────────┘          │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────┐          │
│  │                 Utilities                          │          │
│  │  geminiService.js  (OpenRouter AI)                 │          │
│  │  cyclePrediction.js  (Cycle math)                  │          │
│  │  pcosScoring.js  (PCOS risk algorithm)             │          │
│  │  reminderCron.js  (Hourly cron job)                │          │
│  └────────────────────────────────────────────────────┘          │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────┐          │
│  │              Mongoose Models                       │          │
│  │  User · CycleLog · DailyLog · Reminder             │          │
│  └──────────────────────┬─────────────────────────────┘          │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │    MongoDB       │
                 │  (femflow DB)    │
                 └──────────────────┘

                          ▲
                          │ (AI calls)
                 ┌────────┴─────────┐
                 │  OpenRouter API  │
                 │  (LLM Gateway)   │
                 └──────────────────┘
```

---

## Technology Stack

| Layer        | Technology                              | Version  |
| ------------ | --------------------------------------- | -------- |
| **Frontend** | React                                   | 19.2     |
| **Routing**  | React Router DOM                        | 7.13     |
| **Charts**   | Recharts                                | 3.8      |
| **HTTP**     | Axios                                   | 1.13     |
| **Icons**    | React Icons (Feather)                   | 5.6      |
| **Bundler**  | Vite                                    | 7.3      |
| **Backend**  | Node.js + Express.js                    | 4.21     |
| **Database** | MongoDB (via Mongoose)                  | 8.5      |
| **Auth**     | JWT (jsonwebtoken) + bcryptjs           | 9.0 / 2.4|
| **AI**       | OpenRouter API (OpenAI-compatible SDK)  | 6.27     |
| **AI Model** | nvidia/nemotron-3-super-120b-a12b:free  | —        |
| **Cron**     | node-cron                               | 3.0      |

---

## Project Structure

```
femflow/
├── client/                          # React SPA (Vite)
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── eslint.config.js             # ESLint config
│   ├── public/                      # Static assets
│   └── src/
│       ├── main.jsx                 # React DOM render
│       ├── App.jsx                  # App shell, routes
│       ├── App.css                  # Global styles
│       ├── index.css                # Root CSS
│       ├── assets/                  # Images, fonts, etc.
│       ├── components/
│       │   ├── Navbar.jsx           # Navigation bar
│       │   └── ProtectedRoute.jsx   # Auth route guard
│       ├── context/
│       │   └── AuthContext.jsx      # Auth state (React Context)
│       ├── pages/
│       │   ├── Login.jsx            # Login page
│       │   ├── Register.jsx         # Registration page
│       │   ├── Dashboard.jsx        # Main dashboard
│       │   ├── Cycles.jsx           # Cycle tracking page
│       │   ├── DailyLog.jsx         # Daily health log page
│       │   ├── Analytics.jsx        # Analytics & charts page
│       │   └── Reminders.jsx        # Reminders management
│       ├── services/
│       │   └── api.js               # Axios API client
│       └── utils/                   # Frontend utilities
│
├── server/                          # Express.js API
│   ├── .env                         # Environment variables
│   ├── package.json                 # Backend dependencies
│   ├── server.js                    # Entry point
│   ├── middleware/
│   │   └── auth.js                  # JWT auth middleware
│   ├── models/
│   │   ├── User.js                  # User model (bcrypt hashing)
│   │   ├── CycleLog.js             # Menstrual cycle model
│   │   ├── DailyLog.js             # Daily health log model
│   │   └── Reminder.js             # Reminder model
│   ├── routes/
│   │   ├── auth.js                  # /api/auth routes
│   │   ├── cycles.js                # /api/cycles routes
│   │   ├── logs.js                  # /api/logs routes
│   │   ├── analytics.js             # /api/analytics routes
│   │   └── reminders.js             # /api/reminders routes
│   ├── controllers/
│   │   ├── authController.js        # Register, Login, GetMe
│   │   ├── cycleController.js       # CRUD + predictions
│   │   ├── logController.js         # CRUD for daily logs
│   │   ├── analyticsController.js   # PCOS score, summary, AI
│   │   └── reminderController.js    # CRUD for reminders
│   └── utils/
│       ├── geminiService.js         # OpenRouter AI (LLM calls)
│       ├── cyclePrediction.js       # Cycle prediction math
│       ├── pcosScoring.js           # PCOS risk algorithm
│       └── reminderCron.js          # Hourly reminder checker
│
├── ARCHITECTURE.md                  # This file
└── README.md                        # Project README
```

---

## Backend Architecture

### Server Entry Point

**File:** `server/server.js`

The Express server initializes in this order:

1. Loads environment variables via `dotenv`
2. Registers middleware: `cors()`, `express.json()`
3. Mounts 5 route groups under `/api/`
4. Registers a health check endpoint at `GET /api/health`
5. Schedules a cron job (`0 * * * *` — every hour on the hour) to run `checkReminders()`
6. Connects to MongoDB and starts listening on `PORT`

### Database Models

#### User (`models/User.js`)

| Field              | Type     | Details                           |
| ------------------ | -------- | --------------------------------- |
| `name`             | String   | Required, trimmed                 |
| `email`            | String   | Required, unique, lowercase       |
| `password`         | String   | Required, min 6 chars, `select: false` |
| `dateOfBirth`      | Date     | Optional                          |
| `averageCycleLength` | Number | Default: 28                       |
| `averagePeriodLength`| Number | Default: 5                        |
| `timestamps`       | —        | `createdAt`, `updatedAt` auto     |

- **Pre-save hook:** Hashes password with bcrypt (salt rounds: 10) if password is modified.
- **Instance method:** `comparePassword(candidate)` — compares plaintext against stored hash.

#### CycleLog (`models/CycleLog.js`)

| Field          | Type     | Details                              |
| -------------- | -------- | ------------------------------------ |
| `userId`       | ObjectId | Ref: `User`, required                |
| `startDate`    | Date     | Required                             |
| `endDate`      | Date     | Optional                             |
| `cycleLength`  | Number   | Days between consecutive starts      |
| `periodLength` | Number   | Auto-calculated from start/end       |
| `flow`         | String   | Enum: `light`, `medium`, `heavy`     |
| `notes`        | String   | Optional, trimmed                    |

- **Pre-save hook:** Auto-calculates `periodLength` from `startDate` and `endDate`.

#### DailyLog (`models/DailyLog.js`)

| Field             | Type       | Details                                     |
| ----------------- | ---------- | ------------------------------------------- |
| `userId`          | ObjectId   | Ref: `User`, required                       |
| `date`            | Date       | Required                                    |
| `mood`            | String     | Enum: `great`, `good`, `okay`, `bad`, `terrible` |
| `symptoms`        | [String]   | Enum: 17 symptom types (cramps, bloating, headache, etc.) |
| `sleepHours`      | Number     | 0–24                                        |
| `waterIntake`     | Number     | Glasses, min 0                              |
| `exerciseMinutes` | Number     | Min 0                                       |
| `stressLevel`     | Number     | 1–5                                         |
| `diet`            | [String]   | Enum: 9 diet categories                     |
| `weight`          | Number     | kg                                          |
| `notes`           | String     | Optional                                    |

- **Unique compound index:** `{ userId: 1, date: 1 }` — ensures one log per user per day.
- **Upsert behavior:** The `createOrUpdateLog` controller uses `findOneAndUpdate` with `upsert: true`, so submitting a log for an existing date updates it instead of creating a duplicate.

#### Reminder (`models/Reminder.js`)

| Field           | Type     | Details                                          |
| --------------- | -------- | ------------------------------------------------ |
| `userId`        | ObjectId | Ref: `User`, required                            |
| `type`          | String   | Enum: `period`, `medication`, `hydration`, `exercise`, `sleep`, `custom` |
| `message`       | String   | Required                                         |
| `time`          | String   | `HH:mm` format                                  |
| `days`          | [String] | Enum: `mon` through `sun`                        |
| `isActive`      | Boolean  | Default: `true`                                  |
| `lastTriggered` | Date     | Set by cron when triggered                       |

### API Routes & Controllers

All routes (except auth) are protected by the JWT `auth` middleware.

#### Authentication — `/api/auth`

| Method | Endpoint        | Controller         | Auth | Description                    |
| ------ | --------------- | ------------------ | ---- | ------------------------------ |
| POST   | `/register`     | `register`         | No   | Create account, return JWT     |
| POST   | `/login`        | `login`            | No   | Verify credentials, return JWT |
| GET    | `/me`           | `getMe`            | Yes  | Return current user profile    |

**Token format:** `Bearer <jwt>` in the `Authorization` header.  
**Token lifetime:** 30 days.  
**Payload:** `{ userId }` signed with `JWT_SECRET`.

#### Cycles — `/api/cycles`

| Method | Endpoint     | Controller       | Description                                    |
| ------ | ------------ | ---------------- | ---------------------------------------------- |
| POST   | `/`          | `createCycle`    | Log a new period; auto-calculates `cycleLength` by comparing with previous cycle |
| GET    | `/`          | `getCycles`      | Get all cycles (sorted newest first)           |
| GET    | `/predict`   | `getPrediction`  | Get cycle prediction + AI insights + motivational line |
| PUT    | `/:id`       | `updateCycle`    | Update a cycle record                          |
| DELETE | `/:id`       | `deleteCycle`    | Delete a cycle record                          |

**`getPrediction` detail:**  
1. Runs `predictNextCycle()` (statistical math)
2. Runs `getCycleIrregularity()` for std deviation data
3. In parallel: calls `getAICyclePrediction()` (OpenRouter) + `getMotivationalLine()` (OpenRouter)
4. Returns merged response with prediction data, AI insights, and motivational line

#### Daily Logs — `/api/logs`

| Method | Endpoint   | Controller           | Description                     |
| ------ | ---------- | -------------------- | ------------------------------- |
| POST   | `/`        | `createOrUpdateLog`  | Create or upsert today's log    |
| GET    | `/`        | `getLogs`            | Get logs (optional `from`/`to` query params) |
| GET    | `/today`   | `getTodayLog`        | Get today's log only            |
| DELETE | `/:id`     | `deleteLog`          | Delete a specific log           |

#### Analytics — `/api/analytics`

| Method | Endpoint          | Controller         | Description                                    |
| ------ | ----------------- | ------------------ | ---------------------------------------------- |
| GET    | `/pcos-score`     | `getPCOSScore`     | Compute and return PCOS risk score (0–100)     |
| GET    | `/summary`        | `getSummary`       | 30-day summary: prediction, symptoms, mood, lifestyle averages, motivational line |
| GET    | `/ai-suggestions` | `getAISuggestions`  | AI-generated personalized health suggestions   |

**`getSummary` returns:**
- `totalCycles` — count of all logged cycles
- `prediction` — next period, ovulation, fertile window
- `irregularity` — cycle standard deviation
- `symptomFrequency` — map of symptom → count (last 30 days)
- `moodDistribution` — map of mood → count (last 30 days)
- `lifestyle` — averages for sleep, water, exercise, stress
- `motivationalLine` — AI-generated motivational text

**`getAISuggestions` returns** (from OpenRouter LLM):
- `greeting` — personalized greeting
- `overallAssessment` — health assessment text
- `suggestions[]` — array of `{ category, icon, title, description, priority }`
- `dailyAffirmation` — empowering affirmation
- `disclaimer` — medical disclaimer

#### Reminders — `/api/reminders`

| Method | Endpoint   | Controller           | Description                    |
| ------ | ---------- | -------------------- | ------------------------------ |
| POST   | `/`        | `createReminder`     | Create a new reminder          |
| GET    | `/`        | `getReminders`       | Get all reminders for user     |
| GET    | `/active`  | `getActiveReminders` | Get only active reminders      |
| PUT    | `/:id`     | `updateReminder`     | Update reminder (toggle, edit) |
| DELETE | `/:id`     | `deleteReminder`     | Delete a reminder              |

### Middleware

#### JWT Auth (`middleware/auth.js`)

1. Extracts `Authorization: Bearer <token>` header
2. Verifies token with `jwt.verify()` using `JWT_SECRET`
3. Looks up user by `decoded.userId` in MongoDB
4. Attaches `req.user` (full Mongoose document) for downstream use
5. Returns `401` if token is missing, invalid, or user not found

### Utility Modules

#### Cycle Prediction (`utils/cyclePrediction.js`)

Exports 4 functions:

| Function                     | Purpose                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| `calculateAverageCycleLength` | Computes avg from last 6 cycles, filtering outliers (15–60 days). Default: 28 |
| `calculateAveragePeriodLength`| Computes avg period length from last 6 cycles. Default: 5       |
| `predictNextCycle`           | Returns: `nextPeriodStart`, `nextPeriodEnd`, `ovulationDate`, `fertileWindow`, `daysUntilPeriod`, `cycleDay` |
| `getCycleIrregularity`       | Returns: `stdDev`, `isIrregular` (>7 days std dev), `cycleLengths`, `mean` |

**Prediction logic:**
- Next period = last period start + average cycle length
- Ovulation = next period start − 14 days
- Fertile window = ovulation date − 5 days to ovulation + 1 day

#### PCOS Scoring (`utils/pcosScoring.js`)

Exports `getPCOSRiskScore(cycles, dailyLogs)`.

Scoring breakdown (total 0–100):

| Category              | Max  | Factors                                                  |
| --------------------- | ---- | -------------------------------------------------------- |
| Cycle Regularity      | 30   | Std deviation of cycle lengths; long/short cycle penalty  |
| Symptom Frequency     | 40   | Frequency of 10 PCOS-related symptoms over logged days    |
| Lifestyle Factors     | 30   | Poor sleep (<6h), low exercise (<15min), high stress (>4), unhealthy diet ratio |

**Risk Levels:**
- 0–30 → Low (Green `#4CAF50`)
- 31–60 → Moderate (Orange `#FF9800`)
- 61–100 → High (Red `#F44336`)

Returns: `totalScore`, `riskLevel`, `color`, `breakdown`, `tips[]`, `disclaimer`.

#### Reminder Cron (`utils/reminderCron.js`)

Exports `checkReminders()`:
- Runs every hour (scheduled in `server.js`)
- Queries active reminders matching current day-of-week and current hour (`:00`)
- Updates `lastTriggered` timestamp on each matched reminder
- Logs triggered reminders to console

### AI Integration (OpenRouter)

**File:** `utils/geminiService.js`

Uses the **OpenAI-compatible SDK** (`openai` npm package) pointing at OpenRouter's base URL.

**Client initialization:**
```js
new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'FemFlow PCOS Tracker',
  },
})
```

**Model:** `nvidia/nemotron-3-super-120b-a12b:free`

**Three exported functions:**

| Function               | Input                        | Output                         | Used By                    |
| ---------------------- | ---------------------------- | ------------------------------ | -------------------------- |
| `getMotivationalLine`  | userName, cycleDay, daysUntilPeriod | Short motivational text with emoji | Dashboard, Cycles, Summary |
| `getAICyclePrediction` | cycleData object             | JSON: phaseInfo, bodyTip, wellnessTip, prediction_note, encouragement | Cycle Prediction endpoint |
| `getHealthSuggestions` | userData object              | JSON: greeting, assessment, suggestions[], affirmation, disclaimer | AI Suggestions endpoint   |

**Fallback behavior:** All functions have try/catch blocks. On any AI failure, they return hardcoded default responses to ensure the app never crashes.

---

## Frontend Architecture

### App Shell & Routing

**File:** `src/App.jsx`

The app uses `BrowserRouter` from React Router v7. Route structure:

| Path          | Component     | Auth Required | Description          |
| ------------- | ------------- | ------------- | -------------------- |
| `/login`      | `Login`       | No            | Redirects to `/` if logged in |
| `/register`   | `Register`    | No            | Redirects to `/` if logged in |
| `/`           | `Dashboard`   | Yes           | Main dashboard       |
| `/cycles`     | `Cycles`      | Yes           | Cycle tracking       |
| `/log`        | `DailyLog`    | Yes           | Daily health log     |
| `/analytics`  | `Analytics`   | Yes           | Charts & analytics   |
| `/reminders`  | `Reminders`   | Yes           | Reminder management  |
| `*`           | —             | —             | Redirects to `/`     |

### Authentication Flow

**File:** `src/context/AuthContext.jsx`

Uses React Context to provide `{ user, loading, login, register, logout }` to the entire app.

1. **On mount:** Checks `localStorage` for `femflow_token`. If found, calls `GET /api/auth/me` to validate and load user data.
2. **Login:** Calls `POST /api/auth/login`, stores token in `localStorage`, sets `user` state.
3. **Register:** Calls `POST /api/auth/register`, stores token, sets `user` state.
4. **Logout:** Removes token from `localStorage`, sets `user` to `null`.

**Token storage:** `localStorage.femflow_token`

**Route protection:** `ProtectedRoute` component checks `useAuth().user` — redirects to `/login` if `null`.

### Pages

#### Dashboard (`pages/Dashboard.jsx`)
- Fetches 4 API calls in parallel on mount: `getSummary`, `getPCOSScore`, `getCyclePrediction`, `getAISuggestions`
- Displays:
  - AI motivational banner
  - AI daily affirmation
  - Cycle countdown card (days until next period, cycle day, predicted dates, AI phase insight)
  - PCOS risk indicator (score/100, risk level, breakdown bars)
  - Lifestyle averages (sleep, water, exercise, stress)
  - AI body & wellness tips
  - AI personalized suggestions with priority badges
  - PCOS tips
  - Symptom frequency bar chart (Recharts)
  - Mood distribution pie chart (Recharts)

#### Cycles (`pages/Cycles.jsx`)
- Lists all logged cycles with delete capability
- "Log Period" form (start date, end date, flow, notes)
- Prediction card with AI-powered insights (phase info, body tip, wellness tip, prediction note, encouragement)
- AI motivational banner

#### DailyLog (`pages/DailyLog.jsx`)
- Auto-loads today's existing log (upsert on save)
- Sections: Date, Mood picker (5 emoji buttons), Symptoms (17 toggle tags), Lifestyle (sleep/water/exercise/weight + stress slider), Diet (9 toggle tags), Notes
- Success toast on save

#### Analytics (`pages/Analytics.jsx`)
- Fetches: summary, PCOS score, cycles, and 90 days of logs
- Charts:
  - PCOS Risk Assessment detail (score bars per category)
  - Cycle Length Trend (line chart)
  - Symptom Frequency (horizontal bar chart)
  - Mood Distribution (donut pie chart)
  - Mood Trend over time (line chart, mood mapped to 1–5 scale)
  - Sleep Trend (bar chart)

#### Login / Register (`pages/Login.jsx`, `pages/Register.jsx`)
- Standard auth forms with error handling
- Register collects: name, email, password, date of birth (optional)
- Both redirect to Dashboard on success

#### Reminders (`pages/Reminders.jsx`)
- Browser Notification permission request banner
- Create form: type picker (6 types with icons), message, time, day-of-week picker
- Reminder list with toggle active/inactive and delete

### API Service Layer

**File:** `src/services/api.js`

Single Axios instance configured with:
- **Base URL:** `http://localhost:5000/api`
- **Request interceptor:** Auto-attaches `Authorization: Bearer <token>` from `localStorage`

Exports named functions for every API call (23 total), mapped 1:1 to backend endpoints.

---

## Data Flow Diagrams

### Daily Log Submission

```
User fills form → handleSubmit() → createOrUpdateLog(payload)
    → POST /api/logs (with Bearer token)
        → auth middleware validates JWT
        → logController.createOrUpdateLog()
            → DailyLog.findOneAndUpdate({ userId, date }, data, { upsert: true })
            → Returns saved document
        ← 200 JSON response
    ← Success toast displayed
```

### Dashboard Load

```
Dashboard mounts → useEffect fires 4 parallel requests:
    ├── GET /api/analytics/summary
    │       → Queries CycleLogs + DailyLogs (30 days)
    │       → Runs predictNextCycle() + getCycleIrregularity()
    │       → Calls OpenRouter getMotivationalLine()
    │       → Returns aggregated summary
    │
    ├── GET /api/analytics/pcos-score
    │       → Queries CycleLogs + DailyLogs (90 days)
    │       → Runs getPCOSRiskScore()
    │       → Returns score + breakdown + tips
    │
    ├── GET /api/cycles/predict
    │       → Queries CycleLogs
    │       → Runs predictNextCycle() + getCycleIrregularity()
    │       → Parallel: getAICyclePrediction() + getMotivationalLine()
    │       → Returns prediction + AI insights + motivational line
    │
    └── GET /api/analytics/ai-suggestions
            → Queries CycleLogs + DailyLogs (90 days)
            → Computes PCOS score, symptoms, diet, lifestyle
            → Calls OpenRouter getHealthSuggestions()
            → Returns AI-generated suggestions JSON
```

### Authentication

```
Register/Login → POST /api/auth/register or /login
    → authController creates user / verifies password
    → Generates JWT (30-day expiry)
    → Returns { token, user }
    ← Client stores token in localStorage
    ← Sets user in AuthContext
    ← ProtectedRoute now allows access
```

---

## AI Features Deep Dive

FemFlow uses **OpenRouter** as an AI gateway, calling the `nvidia/nemotron-3-super-120b-a12b:free` model through the OpenAI-compatible chat completions API.

### Three AI-Powered Features

#### 1. Motivational Lines
- **Trigger:** Every Dashboard load, every Cycle Prediction load, every Summary request
- **Prompt strategy:** System prompt sets the personality ("warm, caring women's health companion"). User prompt includes the woman's name, cycle day, and days until period.
- **Constraints:** Under 20 words, starts and ends with emoji
- **Fallback:** 5 hardcoded motivational lines, randomly selected

#### 2. Cycle Phase Analysis
- **Trigger:** `GET /api/cycles/predict`
- **Input data sent to LLM:** Average cycle/period length, next period date, ovulation date, days until period, current cycle day, recent cycle lengths
- **Expected JSON response:** `phaseInfo`, `bodyTip`, `wellnessTip`, `prediction_note`, `encouragement`
- **Fallback:** Hardcoded generic tips

#### 3. Health Suggestions
- **Trigger:** `GET /api/analytics/ai-suggestions`
- **Input data sent to LLM:** PCOS score + level, cycle regularity, average sleep/water/exercise/stress, top 5 symptoms, diet patterns
- **Expected JSON response:** `greeting`, `overallAssessment`, `suggestions[]` (4–6 items with category/icon/title/description/priority), `dailyAffirmation`, `disclaimer`
- **Fallback:** Hardcoded generic response

### Error Resilience
All three functions wrap AI calls in try/catch. If the LLM is unavailable, rate-limited, or returns unparseable output, the app gracefully falls back to defaults. The UI never breaks.

---

## PCOS Risk Scoring Algorithm

The algorithm in `pcosScoring.js` evaluates three dimensions:

### 1. Cycle Regularity (0–30 points)
```
Standard Deviation of Cycle Lengths:
  > 10 days → 30 points
  > 7 days  → 20 points
  > 4 days  → 10 points
  ≤ 4 days  → 0 points

Bonus: If average cycle > 35 or < 21 days → +10 (capped at 30)
```

### 2. Symptom Frequency (0–40 points)

Evaluates 10 PCOS-related symptoms: acne, hair_loss, weight_gain, mood_swings, fatigue, insomnia, anxiety, depression, bloating, cravings.

```
For each symptom:
  Frequency > 50% of days → +6 points
  Frequency > 30% of days → +4 points
  Frequency > 10% of days → +2 points
```

### 3. Lifestyle Factors (0–30 points)
```
Sleep:    avg < 6h → +10  |  avg < 7h → +5
Exercise: avg < 15min → +10  |  avg < 30min → +5
Stress:   avg > 4/5 → +10  |  avg > 3/5 → +5
Diet:     >50% days with ≥2 unhealthy items → +10  |  >30% → +5
```

---

## Cycle Prediction Algorithm

Located in `cyclePrediction.js`:

1. **Average Cycle Length:** Mean of last 6 cycle-to-cycle intervals, filtering outliers (only 15–60 day gaps). Default: 28 days.
2. **Average Period Length:** Mean of last 6 `periodLength` values. Default: 5 days.
3. **Next Period Start:** Last period start date + average cycle length.
4. **Ovulation:** Next period start − 14 days (luteal phase assumption).
5. **Fertile Window:** Ovulation − 5 days to Ovulation + 1 day.
6. **Irregularity Detection:** Standard deviation > 7 days = irregular.

---

## Cron Jobs

| Schedule       | Function           | Description                                          |
| -------------- | ------------------ | ---------------------------------------------------- |
| `0 * * * *`    | `checkReminders()` | Every hour: queries active reminders matching current day + hour, updates `lastTriggered` |

---

## Security Model

| Concern            | Implementation                                      |
| ------------------ | --------------------------------------------------- |
| Password storage   | bcrypt with 10 salt rounds (never stored plaintext)  |
| Authentication     | JWT Bearer tokens, 30-day expiry                    |
| Password retrieval | `select: false` on User.password — never leaked in queries |
| Route protection   | All non-auth routes require valid JWT via middleware  |
| Data isolation     | Every query filters by `req.user._id` — users can only access their own data |
| CORS               | Enabled globally (configurable)                     |
| API key security   | OpenRouter API key in `.env`, never exposed to client |

---

## Environment Configuration

**File:** `server/.env`

| Variable             | Description                          | Example                         |
| -------------------- | ------------------------------------ | ------------------------------- |
| `PORT`               | Server port                          | `5000`                          |
| `MONGODB_URI`        | MongoDB connection string            | `mongodb://localhost:27017/femflow` |
| `JWT_SECRET`         | Secret for signing JWTs              | `your_jwt_secret_key_change_this` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features   | `sk-or-v1-...`                  |
