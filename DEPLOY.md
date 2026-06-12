# ClientOS — Deployment Guide

## Frontend → Vercel

1. Push `client/` folder to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `client`
4. Add Environment Variables:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   VITE_SOCKET_URL=https://your-render-app.onrender.com
   ```
5. Deploy — Vercel auto-detects Vite

---

## Backend → Render

1. Push `server/` folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Set **Root Directory** to `server`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node index.js`
6. Add Environment Variables (from your `.env`):
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   GEMINI_API_KEY=...
   EMAIL_USER=...
   EMAIL_PASS=...
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
7. Deploy

---

## Post-Deploy Checklist

- [ ] Update `CLIENT_URL` in Render to your Vercel URL
- [ ] Update `VITE_API_URL` + `VITE_SOCKET_URL` in Vercel to your Render URL
- [ ] Test register → login → create client → create project → generate proposal
- [ ] Test invoice PDF download
- [ ] Test client portal (create portal account → login as client)
- [ ] Verify Socket.io notifications work in production (check Render logs)

---

## Gmail App Password Setup (for email)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail" on "Other device"
4. Use this as `EMAIL_PASS` in Render

---

## MongoDB Atlas Setup

1. [cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow `0.0.0.0/0` (all IPs for Render)
4. Connect → Drivers → Copy connection string
5. Replace `<password>` with your DB user password in `MONGO_URI`
