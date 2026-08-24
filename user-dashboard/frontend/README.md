# NWSSU Campus Tour — User Dashboard (Public Site)

Standalone React + Vite app — the public-facing campus tour, split
out of the original combined `nwssu-campus-tour` project. Everything
that used to live under `src/admin/` has been moved to a separate
`Admin-dashboard/frontend` app; this project no longer contains any
admin code or routes.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build
npm run preview   # http://localhost:4173/
```

## What changed vs. the original combined app

- `src/App.jsx` no longer imports or routes to anything under
  `src/admin/` — that folder doesn't exist in this project anymore.
- `recharts` was removed from `package.json` (it was only used by
  the admin Reports page). `three` is still here for `PanoramaTour`.
- Routes: `/`, `/buildings`, `/departments`, `/offices`, `/about`,
  `/ar/:id`.

## Note on shared data

`src/data/data.js` here is the same seed data used by
`Admin-dashboard/frontend`, but they are now two independent copies.
Editing a record in the admin dashboard's CRUD UI only updates that
app's own `localStorage` — it will not appear here. If both apps
need to reflect the same live data, you'll want a shared backend/API
instead of two static copies.
