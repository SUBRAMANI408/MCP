# Digital Sports Association Platform

A comprehensive full-stack sports association management platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Zustand |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Real-time | Socket.IO |
| Auth | JWT (access + refresh tokens) |
| Media | Cloudinary |
| PDF | PDFKit |

## Project Structure

```
MCP1/
├── server/         # Express.js backend
│   └── src/
│       ├── config/
│       ├── models/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── socket/
│       └── utils/
└── client/         # React + Vite frontend
    └── src/
        ├── api/
        ├── app/
        ├── components/
        ├── features/
        ├── hooks/
        ├── layouts/
        ├── pages/
        ├── context/
        └── utils/
```

## Roles

1. **System Admin** — Manages associations, users, sports master list
2. **Association Head** — Approves teams/expenses, manages organizers
3. **Tournament Organizer** — Creates tournaments, fixtures, results
4. **Team Captain** — Manages team, bookings, friendly matches
5. **Vice Captain** — Assists captain when inactive
6. **Ground Booking Officer** — Approves/allocates ground bookings
7. **Funds Officer** — Collects fees, records expenses, generates receipts
8. **Player** — Views fixtures, stats, live scores

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Setup

1. Copy `.env.example` to `.env` in the `server/` directory and fill in your credentials.

2. Install dependencies:
```bash
npm run install:all
```

3. Start the backend:
```bash
npm run dev:server
```

4. Start the frontend:
```bash
npm run dev:client
```

Backend runs on `http://localhost:5000`  
Frontend runs on `http://localhost:5173`

## API Base Path

```
http://localhost:5000/api/v1
```

## Modules

- Authentication & User Management
- Association Management
- Team Management (Captain/Vice Captain workflows)
- Ground Booking (with conflict resolution & priority)
- Tournament Management (fixtures, scheduling, results)
- Friendly Matches
- Live Scoring (sport-specific, real-time Socket.IO)
- Communication (Association Group + Team Group Chat)
- Funds Management (income, expenses, receipts, approval workflow)
- Reports & Analytics (role-scoped)
- Notifications
