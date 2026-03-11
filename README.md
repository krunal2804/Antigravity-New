# GovernX — Project Governance Platform

A full-stack project governance platform for consulting companies to track projects from start to end.

## Project Structure

```
├── backend/         # Express.js + PostgreSQL API
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── middleware/auth.js     # JWT auth + RBAC middleware
│   │   ├── routes/                # API route handlers
│   │   └── database/
│   │       ├── db.js              # Knex connection
│   │       ├── migrations/        # 17 table migrations
│   │       └── seeds/             # Role, permission, service seeds
│   ├── knexfile.js                # Knex config (dev/staging/prod)
│   ├── .env                       # Environment variables
│   └── package.json
│
├── frontend/        # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                # Router + protected routes
│   │   ├── api.js                 # Axios client with JWT
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx  # Sidebar + topbar
│   │   └── pages/                 # All page components
│   ├── vite.config.js             # Vite + API proxy
│   └── package.json
│
└── README.md
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
cp .env.example .env        # Edit with your DB credentials
npm install
npm run migrate             # Create 17 database tables
npm run seed                # Seed roles, permissions, services
npm run dev                 # Start API on http://localhost:3000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Start UI on http://localhost:5173
```

### 3. Open the App
Visit **http://localhost:5173** → Register an account → Start using the platform.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, Knex.js, JWT
- **Frontend:** React, Vite, React Router, Axios
