# ClientOS — AI-Powered Agency Management Platform

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)
![Tech Stack](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat&logo=google)
![Tech Stack](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat&logo=socket.io)

> A full-stack SaaS platform for web agencies to manage clients, projects, invoices, and AI-generated proposals — built by Amit Yadav / Codexora Solutions.

---

## Features

- **Auth System** — JWT (access + refresh tokens), role-based (Admin / Client)
- **Dashboard** — Stats cards, revenue chart (Recharts), recent projects
- **Client Management** — Full CRUD with search & filter
- **Project Management** — Kanban board with drag-and-drop tasks
- **AI Proposal Generator** — Powered by Google Gemini 1.5 Flash
- **Invoice System** — PDF generation, payment tracking
- **Client Portal** — Separate login for clients to view their data
- **Real-time Notifications** — Socket.io
- **Email Alerts** — Nodemailer

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (access + refresh tokens) |
| AI | Google Gemini 1.5 Flash |
| Real-time | Socket.io |
| Charts | Recharts |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
clientos/
├── client/          # React frontend (Vite)
└── server/          # Node.js + Express backend
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key (free at aistudio.google.com)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** — copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/clientos
JWT_SECRET=your_long_random_secret
JWT_REFRESH_SECRET=your_long_random_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
```

**Client** — copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

App runs at: **http://localhost:5173**

---

## Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist to Vercel
```

### Backend → Render
- Set all environment variables in Render dashboard
- Set `CLIENT_URL` to your Vercel frontend URL

---

## Build Phases

- [x] **Phase 1** — Auth, Dashboard, Sidebar layout, all models & routes
- [x] **Phase 2** — Client CRUD + detail view, Project CRUD + Kanban board (drag & drop)
- [x] **Phase 3** — AI Proposal Generator (Gemini 1.5 Flash), Invoice system + PDF download
- [x] **Phase 4** — Client Portal, Socket.io real-time, Nodemailer emails, Vercel + Render deploy config

---

## Author

**Amit Yadav** — [GitHub @amityadav8467](https://github.com/amityadav8467) | Codexora Solutions
