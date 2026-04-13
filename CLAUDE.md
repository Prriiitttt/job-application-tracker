# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JobTrackr** — A client-side React SPA for tracking job applications. All data is stored in browser localStorage (no backend/API). Deployed on Vercel as a static site.

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

**State management:** Centralized in `App.jsx` — `applications` array lives in `useState`, synced to localStorage via `useEffect`. Passed as props to pages. No external state library.

**Data model:**
- `applications` (localStorage key) — array of `{ id, company, role, date, status, notes }` where status is `"applied" | "interview" | "rejected"`
- `weeklyGoal` (localStorage key) — number

**Routing:** `createBrowserRouter` in `App.jsx` with `Layout` as parent route (sidebar/nav + `<Outlet />`). Routes: `/` (Home), `/applied`, `/analytics`, `*` (Error). `vercel.json` rewrites handle SPA routing in production.

**Key libraries:**
- **Motion** (framer-motion successor) — page transitions, modal animations
- **Recharts** — bar/pie charts on Analytics page
- **Lucide React** — icons

**Styling:** Per-component CSS files, dark theme (`#0a0f1e` bg). Mobile breakpoint at 430px — sidebar becomes bottom nav, tables become cards.
