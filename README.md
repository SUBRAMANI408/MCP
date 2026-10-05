# Digital Sports Association Platform

A production-ready, full-stack multi-sport, multi-association sports management platform featuring fair ground allocation, real-time live match scoring, tournament brackets, structured financial workflows, in-app messaging, and role-based permissions across 8 distinct platform roles.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│   (Tailwind CSS · Zustand State · Axios Interceptors · Socket.IO Client)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket (Port 5000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       Node.js + Express Backend                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Middleware: JWT Auth · Rate Limiting · Multi-Tenant Scope Guard   │ │
│ │             Rule 12 Scorer Locks · RBAC Authorization              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────── Core Services ──────────────────────────┐ │
│ │ • Cricket & Multi-Sport Scoring Engine (Ball-by-ball, NRR, DLS)    │ │
│ │ • Weighted Fair Ground Allocation Engine                           │ │
│ │ • Tournament Bracket & Round-Robin Generator                       │ │
│ │ • Automated Match Completion & Standings Rollup                    │ │
│ │ • Razorpay Payments & Cloudinary Media Streaming                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │                                   │
      ┌─────────────▼─────────────┐       ┌─────────────▼─────────────┐
      │  MongoDB / Memory Server  │       │ Third-Party Cloud Services│
      │   (Mongoose 8 ODM)        │       │  Cloudinary · Razorpay    │
      │ 20+ Normalized Schemas    │       │  Nodemailer (SMTP/PDF)    │
      └───────────────────────────┘       └───────────────────────────┘
```

---

## 👥 The 8 Platform Roles & Permissions

| Role | Scope | Key Capabilities & Boundary |
|------|-------|------------------------------|
| **System Admin** (`admin`) | Global (Multi-Tenant) | Full platform supervision, association approval, global user locking, audit log CSV export, sport master configuration. |
| **Association Head** (`association_head`) | Association-Scoped | Team registrations review, expense request approvals, tournament sanctions, announcement broadcasts, group moderation. |
| **Tournament Organizer** (`tournament_organizer`) | Association-Scoped | Tournament lifecycle (creation to final), registration review, knockout/round-robin fixture generation, standings. |
| **Ground Officer** (`ground_officer`) | Association-Scoped | Ground facility maintenance windows, fair priority booking queue review, alternate slot proposals, ground scheduling. |
| **Funds Officer** (`funds_officer`) | Association-Scoped | Financial dashboard telemetry, income recording with PDF receipt generation, expense request payouts, Razorpay verification. |
| **Team Captain** (`captain`) | Team-Scoped | Team roster creation, player invitations, ground booking submissions, friendly match requests, tournament registrations. |
| **Team Vice Captain** (`vice_captain`) | Team-Scoped | Full operational fallback for team captain (squad management, match operation, booking) when captain is unavailable. |
| **Player** (`player`) | Individual / Team | View team fixtures, practice schedules, live match ball-by-ball feeds, team chat, individual career/season statistics. |

---

## 🔑 Demo Seed Accounts

The platform includes a comprehensive, one-step seeding script that initializes full demo data (2 sports, 3 grounds with maintenance windows, 8 teams with full rosters, 2 tournaments, fixtures, 1 live cricket match, 1 completed cricket match, 1 completed football match, expense requests, and funds ledger).

All seed accounts use the default password: **`password123`**

| Role | Email | Association / Focus |
|------|-------|---------------------|
| **System Admin** | `admin@sports.com` | Global Platform Admin |
| **Association Head** | `head@cricket.com` | Premier Cricket Association |
| **Tournament Organizer**| `organizer@cricket.com`| Metro T20 Knockout Championship |
| **Ground Officer** | `ground@cricket.com` | Central Oval & City Arena Pitch |
| **Funds Officer** | `funds@cricket.com` | Premier Cricket Association Treasury |
| **Association Head** | `head@football.com` | Metro Football Association |
| **Tournament Organizer**| `organizer@football.com`| State Football Super League |
| **Team Captain** | `rc_cap@cricket.com` | Royal Challengers XI (Cricket) |
| **Team Vice Captain** | `rc_vc@cricket.com` | Royal Challengers XI (Cricket) |
| **Team Captain** | `cu_cap@football.com` | City United FC (Football) |
| **Player** | `rc_player1@cricket.com` | Royal Challengers XI (Cricket) |

---

## ⚙️ Environment Variables Reference

Create or verify `server/.env`:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/sports
ALLOW_MEMORY_DB=true                 # Required to enable automatic in-memory fallback in development

# Authentication & JWT
JWT_SECRET=your_jwt_secret_min_32_characters_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_min_32_characters_here
JWT_REFRESH_EXPIRES_IN=30d

# Server & Client URLs
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cloudinary (Media Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Payments (Optional in test mode)
RAZORPAY_KEY_ID=rzp_test_key
RAZORPAY_KEY_SECRET=rzp_test_secret

# SMTP Email (Optional in development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
```

---

## 🚀 Quickstart & Development

### 1. Install Dependencies
```bash
# From repository root
npm run install:all
```

### 2. Populate Full Demo Data
```bash
# Populates cricket & football associations, grounds, 8 teams, tournaments, live matches, & funds
npm run seed:demo
```

### 3. Run Backend & Frontend in Development Mode
In two separate terminals or background processes:
```bash
# Terminal 1 — Start Express backend (Port 5000)
npm run dev:server

# Terminal 2 — Start Vite React frontend (Port 5173)
npm run dev:client
```

### 4. Build Frontend for Production
```bash
npm run build --workspace=client
```

---

## 📡 API Reference Overview (`/api/v1`)

### Authentication & Account Security
- `POST /auth/register` — Public registration (strictly creates `player` accounts; escalations prohibited)
- `POST /auth/login` — Account authentication (enforces 5-attempt / 15-minute lockouts)
- `POST /auth/refresh` — Secure refresh token rotation
- `POST /auth/logout` — Revokes current refresh token session
- `POST /auth/logout-all` — Revokes all active user sessions

### Live Match Scoring & Scorecard Engine
- `POST /matches/:id/start` — Rule 12 guarded match commencement
- `POST /scoring/:id/ball` — Ball-by-ball event logger (updates runs, wickets, extras, bowler/striker stats)
- `POST /scoring/:id/batsman` — Striker / Non-striker batsman selection
- `POST /scoring/:id/bowler` — Active bowler change (enforces no consecutive overs)
- `POST /scoring/:id/strike-swap` — Swaps striker and non-striker
- `POST /scoring/:id/undo` — Rolls back last recorded ball event
- `POST /scoring/:id/abandon` — Abandons match with official reason
- `GET /scoring/:id/scorecard` — Generates complete innings scorecard (batting tables, bowling analysis, extras, fall of wickets, run rates)
- `PUT /matches/:id/complete` — Concludes match, writes `MatchResult`, updates team stats and standings

### Tournaments & Standings
- `GET /tournaments` — Scoped tournament listings with pagination and filters
- `POST /tournaments` — Create tournament with fee, deadlines, rules, prize info
- `POST /tournaments/:id/fixtures/generate` — Single-elimination knockout and group-to-knockout generator
- `GET /tournaments/:id/standings` — Dynamic standings table (points, Net Run Rate, Goal Difference, form streaks)
- `GET /tournaments/:id/registrations` — Tournament registration applications
- `PATCH /tournaments/:id/registrations/:regId` — Approve or reject team registration

### Ground Booking & Fair Allocation
- `POST /bookings` — Booking submission with maintenance conflict checks and weighted priority scoring
- `GET /bookings/allocation-queue` — Ranked priority queue for ground officers
- `POST /bookings/:id/propose-slot` — Officer alternate time slot proposal
- `PUT /bookings/:id/reschedule` — Reschedule booking to proposed or updated slot

### Funds, Expenses & Payments
- `GET /funds/dashboard` — Association financial aggregation (income, expenses, balance, pending requests)
- `POST /funds/income` — Record revenue entry (with non-fatal PDF receipt generation)
- `GET /expenses` — Association expense requests lifecycle
- `POST /expenses` — Submit structured expense request
- `PATCH /expenses/:id/review` — Association Head expense approval/rejection
- `POST /expenses/:id/pay` — Funds Officer payment fulfillment & automatic ledger posting
- `POST /payments/order` — Create Razorpay order (for tournament registration or membership)
- `POST /payments/verify` — HMAC signature verification & automated status updates

### Uploads & System Administration
- `POST /uploads` — Multipart Cloudinary file upload
- `GET /admin/audit-logs/export` — Export association audit trail to CSV
- `PUT /admin/users/:id/lock` — Administrative lock/unlock of user accounts
