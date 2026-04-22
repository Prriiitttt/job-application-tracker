# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JobTrackr** — A React SPA for tracking job applications with social networking features. Backend powered by Supabase (auth, database, storage). Deployed on Vercel as a static site.

Live: https://job-trackr-umber.vercel.app/

## Commands

All commands run from `application-tracker/` (not the repo root):

```bash
cd application-tracker
npm run dev      # Vite dev server (localhost:5173, network-accessible)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint (flat config, v9)
```

No test runner is configured.

## Architecture

**Stack:** React 19 + React Router v7 + Vite 8 + vanilla CSS (dark theme). No TypeScript.

**Backend:** Supabase — auth (email/password + Google/GitHub OAuth), PostgreSQL database, file storage (resumes bucket).

**State management:** Centralized in `App.jsx` — `applications` array lives in `useState`, synced to Supabase via async functions. `session` from Supabase auth passed as props to pages. No external state library.

**Data model (Supabase tables):**
- `application` — `{ id, user_id, company, role, data (date), status, notes, resume_url }` where status is `"applied" | "interview" | "rejected"`
- `profiles` — `{ id (FK to auth.users), username, full_name, bio, avatar_url, created_at }` — auto-created on signup via DB trigger
- `connections` — `{ id, requester_id, receiver_id, status, created_at }` where status is `"pending" | "accepted" | "declined"`
- `user_settings` — stores `weeklyGoal` per user

**Storage:** Supabase Storage bucket `resumes` — files stored at `{user_id}/{application_id}-{filename}`, accessed via signed URLs (60s expiry).

**Routing:** `createBrowserRouter` in `App.jsx` with `Layout` as parent route (sidebar/nav + `<Outlet />`). Routes:
- `/` — Home (dashboard overview)
- `/applied` — Applications list/kanban with CRUD, search, filter, drag-and-drop
- `/analytics` — Charts and weekly goal
- `/profile/me` — Own profile (editable)
- `/profile/:username` — Other user's profile (view only, stats gated behind connection)
- `/discover` — Browse/search users, send connection requests
- `/connections` — Accepted connections list
- `*` — Error page

**Auth:** Supabase auth with email/password, Google OAuth, and GitHub OAuth. Login page at `src/pages/Login.jsx`. Session managed in `App.jsx` via `supabase.auth.onAuthStateChange`.

**Key libraries:**
- **Supabase JS** — auth, database, storage
- **Motion** (framer-motion successor) — page transitions, modal animations
- **Recharts** — bar/pie charts on Analytics page
- **Lucide React** — icons

**Styling:** Per-component CSS files, dark theme (`#0a0f1e` bg). Mobile breakpoint at 430px — sidebar becomes bottom nav, tables become cards. Logout button moves to mobile header on small screens.

## Key Patterns

- Application form uses a fixed-position modal with backdrop blur
- Kanban board uses HTML5 drag-and-drop on desktop + touch events (via `useEffect` with `{ passive: false }`) on mobile
- Resume upload happens after application creation — needs the app ID for the storage path
- Connection privacy: application stats on profiles are only visible to the user themselves or accepted connections
- Discover page filters out already-connected users
- Supabase FK joins may fail with hint syntax — use separate queries + `.in()` instead
