# 🌸 FemFlow – PCOS Risk Assessment & Women's Health Platform

A full-stack MERN web application for personal PCOS risk assessment and menstrual health tracking. Helps detect early PCOS indicators through daily symptom tracking, cycle pattern analysis, and AI-powered health insights.

---

## 🎯 Features
- **Daily Flow Tracking** — One-click period logging with flow intensity tracking
- **PCOS Risk Scoring** — Algorithmic 0-100 risk assessment based on cycle regularity, symptoms, and lifestyle
- **AI Health Insights** — Personalized wellness suggestions powered by OpenRouter AI
- **Cycle Predictions** — Next period, ovulation, and fertile window calculations
- **Health Analytics** — Visual charts for symptoms, mood, sleep, and lifestyle trends
- **Daily Logging** — Track mood, symptoms, sleep, water intake, exercise, stress, diet, and weight
- **Secure & Private** — JWT authentication with complete data isolation per user

---

## 🛠️ Tech Stack
**Frontend:** React 19, Vite, React Router, Recharts, Axios  
**Backend:** Node.js, Express.js, MongoDB, Mongoose  
**Authentication:** JWT + bcrypt  
**AI:** OpenRouter API (nvidia/nemotron model)  
**Icons:** React Icons (Feather)

---
## 📋 Prerequisites
- Node.js >= 18
- MongoDB (local or cloud URI)
- OpenRouter API key ([Get free key](https://openrouter.ai))

---
## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/femflow.git
cd femflow
```

### 2. Setup Backend
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/femflow
JWT_SECRET=your_secure_random_secret
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Start server:
```bash
npm run dev
```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

App runs at `http://localhost:5173`
---

## 📊 PCOS Risk Scoring

The algorithm evaluates three categories (0-100 scale):

- **Cycle Regularity (30 pts)** — Tracks menstrual cycle consistency
- **Symptom Frequency (40 pts)** — Monitors 10 PCOS-related symptoms
- **Lifestyle Factors (30 pts)** — Evaluates sleep, exercise, stress, diet

**Risk Levels:**  
🟢 Low (0-30) • 🟡 Moderate (31-60) • 🔴 High (61-100)

> ⚠️ **Disclaimer:** This is an informational screening tool, NOT a medical diagnosis. Consult healthcare professionals for proper PCOS evaluation.

---

## 📁 Project Structure

```
femflow/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── pages/   # Dashboard, Cycles, DailyLog, Analytics, Auth
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│   └── package.json
│
├── server/          # Express backend
│   ├── models/      # User, CycleLog, DailyLog
│   ├── routes/      # API routes
│   ├── controllers/ # Business logic
│   ├── middleware/  # JWT auth
│   ├── utils/       # AI service, PCOS scoring, predictions
│   └── server.js
│
└── README.md
```

---

## 🔑 Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/cycles` | GET/POST | Manage periods |
| `/api/cycles/predict` | GET | Get predictions |
| `/api/logs` | GET/POST | Daily health logs |
| `/api/analytics/pcos-score` | GET | Get PCOS risk score |
| `/api/analytics/ai-suggestions` | GET | AI health tips |

---

## 🎨 Scripts

**Server:**
```bash
npm start      # Production
npm run dev    # Development (nodemon)
```

**Client:**
```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview build
```

---

## 📝 License

Developed for educational purposes with a focus on women's use

---

<p align="center">Made with 💖 for women's health and PCOS awareness</p>
