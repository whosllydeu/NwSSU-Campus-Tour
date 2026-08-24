# NWSSU Campus Tour — Admin Dashboard

Standalone React + Vite app, split out of the original combined
`nwssu-campus-tour` project's `src/admin/` folder so it can be
developed and deployed independently of the public site.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5174/admin
npm run build
npm run preview   # http://localhost:4174/admin
```

## What changed vs. the original combined app

- No auth gate — same as before, `/admin` is open to anyone who
  navigates there. Add a real login before deploying this publicly.
- All CRUD data (buildings, departments, offices, organizations) is
  seeded from `src/data/data.js` and then persisted to
  **`localStorage`** (`nwssu_admin_v1_*` keys) — there is no backend
  and no shared database. Edits made here do **not** propagate to
  `user-dashboard`, since that app now has its own separate copy of
  the same seed data. If you need admin edits to show up on the
  public site, you'll need to add a real API/database both apps talk
  to.
- The old `useUI()` (toast-only usage) now comes from a local
  `src/context/ToastContext.jsx` instead of the public site's much
  larger `UIContext` — same `{ toast, showToast }` shape, so no admin
  page code had to change beyond the import path.
- The sidebar's "← Back to Campus Tour" link now points to
  `VITE_PUBLIC_SITE_URL` (see `.env.example`) since it's a different
  app/origin now, rather than an internal route.
- Routes are unchanged: `/admin`, `/admin/buildings`,
  `/admin/departments`, `/admin/offices`, `/admin/organizations`,
  `/admin/reports`, `/admin/settings`.

## Structure

```
src/
  main.jsx, App.jsx        entry point + routes
  context/
    AdminContext.jsx       CRUD state, localStorage persistence
    ToastContext.jsx       minimal toast-only context
  components/               AdminLayout, Sidebar, Topbar, DataTable,
                             FormModal, ConfirmDialog, StatCard, Toast
  pages/                     Overview, BuildingsAdmin, DepartmentsAdmin,
                             OfficesAdmin, OrganizationsAdmin, Reports,
                             Settings
  data/
    data.js, arDestinations.js   own copy of the seed dataset
    adminData.js                 derives stable _id keys per record
  styles/
    tokens.css               design tokens (colors, radii, fonts) —
                              keep in sync with user-dashboard's
                              src/styles/style.css :root block
    admin.css                 layout rules
```
