# 🎓 Campus Coin — NextGen BudgetBee
## AI-Powered Student Finance Tracking System

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ (v24.18 used in development)
- npm v10+

### 1. Install Backend Dependencies
```bash
# From the root CampusCoin/ directory:
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

### 3. Seed Database (Auto-runs on first startup)
```bash
# From root:
node server/seed.js
```

### 4. Start Both Servers

**Backend API (Port 5000):**
```bash
node server/index.js
```

**Frontend Dev Server (Port 3000):**
```bash
cd client
npm run dev
```

Open: **http://localhost:3000**

---

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Student** | alex@campus.edu | password123 |
| **Admin** | admin@campuscoin.edu | admin123 |

---

## 📋 Feature Map

### Student Portal
| Feature | Description |
|---------|-------------|
| **Dashboard** | Monthly KPIs, budget vs actual, saving tips, system intelligence |
| **Transaction Logs** | Quick-add form, recurring, edit/delete, filter/search, CSV bulk import |
| **Categories** | Default student categories + personal custom categories (Manage Own) |
| **Monthly Reports** | 6-month trend chart, category pie chart, weekly breakdown, PDF export |
| **Budget Goals** | Per-category spending caps, real-time progress bars, in-app budget alerts |
| **AI Insights & Tips** | Monthly AI narrative, overspending growth flags, saving tips engine, insight history |

### Admin Control Panel
| Feature | Description |
|---------|-------------|
| **System Stats** | Active users, transaction volumes, top categories |
| **Student Management** | Enable/disable accounts, admin password reset |
| **Default Categories** | Add/remove system-wide student categories |
| **Announcements** | Publish info/warning/tip messages to all students |

### AI Features (No External API Key Required)
| Feature | Description |
|---------|-------------|
| **Real-Time Category Predictor** | NLP keyword matching as you type transaction description |
| **AI Self-Learning Engine** | Learns from user corrections to improve future predictions |
| **CSV Batch Categorization** | Auto-assigns categories during bulk import with AI preview |
| **Monthly Spending Narrative** | Data-driven summary generated from your transaction history |
| **Overspending Growth Flagging** | Detects categories with 15%+ MoM spending spikes |
| **Anomaly Detection** | Flags unusually large and duplicate transactions |
| **Predictive Forecast** | Next-month spending projection based on 6-month history |

---

## 🗂️ Project Architecture

```
CampusCoin/
├── server/
│   ├── index.js              # Express backend entry point
│   ├── database.js           # SQLite connection & helpers
│   ├── seed.js               # DB initialization & demo data
│   ├── middleware/
│   │   └── auth.js           # JWT authentication & admin guard
│   └── routes/
│       ├── auth.js           # Auth: register, login, reset password
│       ├── categories.js     # Category CRUD
│       ├── transactions.js   # Transaction CRUD + CSV import
│       ├── budgets.js        # Budget goals + consumption
│       ├── insights.js       # AI monthly insights
│       ├── tips.js           # Saving tips engine
│       ├── ai.js             # Real-time AI category predictor
│       ├── reports.js        # Reports, trends, forecast, anomalies
│       └── admin.js          # Admin control panel API
├── client/
│   ├── src/
│   │   ├── App.tsx           # Main app router & modal orchestration
│   │   ├── main.tsx          # React entry with AuthProvider
│   │   ├── index.css         # Tailwind CSS base styles
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state, dark mode, font size
│   │   ├── services/
│   │   │   └── api.ts            # All API service calls
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx      # Login + Register + Admin tabs
│   │   │   ├── Dashboard.tsx     # Main student dashboard
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── BudgetsPage.tsx
│   │   │   ├── InsightsPage.tsx
│   │   │   └── AdminPage.tsx
│   │   └── components/
│   │       ├── Navbar.tsx             # Top navigation + accessibility
│   │       ├── TransactionModal.tsx   # Quick-add with real-time AI
│   │       ├── CsvImportModal.tsx     # CSV import with AI preview
│   │       ├── ShareModal.tsx         # PDF export + email sharing
│   │       ├── ResetPasswordModal.tsx # Password recovery flow
│   │       └── SitemapModal.tsx       # App sitemap navigation
│   ├── vite.config.ts        # Vite + Tailwind + API proxy
│   └── package.json
├── schema.sql                # SQL schema reference
├── campuscoin.db             # SQLite database (auto-generated)
├── package.json              # Root backend dependencies
└── README.md
```

---

## ♿ Accessibility Features
- **Dark/Light Mode Toggle** (persisted via localStorage)
- **Font Size Accessibility Control**: Small (14px) / Medium (16px) / Large (18px)
- Keyboard-accessible form controls with proper focus indicators

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | Student login |
| POST | `/api/auth/admin-login` | Admin login |
| POST | `/api/auth/forgot-password` | Generate reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/profile` | Get current user profile |
| PUT | `/api/auth/profile` | Update student profile |
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create custom category |
| GET | `/api/transactions` | Get transactions (with filters) |
| POST | `/api/transactions` | Add new transaction |
| POST | `/api/transactions/csv-import` | CSV bulk import |
| GET | `/api/transactions/activity` | Recent activity log |
| POST | `/api/ai/predict-category` | AI category prediction |
| GET | `/api/budgets` | Get monthly budgets + consumption |
| POST | `/api/budgets` | Set/update budget cap |
| GET | `/api/insights/current` | Generate AI insight |
| GET | `/api/insights/history` | All past insights |
| GET | `/api/tips` | Get personalized saving tips |
| GET | `/api/reports/monthly-summary` | Monthly P&L summary |
| GET | `/api/reports/six-month-trend` | Income vs expense trend |
| GET | `/api/reports/daily-weekly` | Daily/weekly breakdowns |
| GET | `/api/reports/forecast` | Next-month spending forecast |
| GET | `/api/reports/anomalies` | Large/duplicate transactions |
| GET | `/api/admin/stats` | System usage statistics |
| GET | `/api/admin/users` | All student users |
| PUT | `/api/admin/users/:id/toggle` | Enable/disable user |
| POST | `/api/admin/users/:id/reset-password` | Reset user password |
