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
npm run test            # Vitest in watch mode
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # One-shot run with v8 coverage
npm run test:e2e        # Playwright (auto-starts dev server)
```

## Testing

**Stack:**
- **Vitest** + **jsdom** for unit and component tests (config in `vite.config.js` under `test`)
- **@testing-library/react** + **@testing-library/jest-dom** + **@testing-library/user-event** for component DOM assertions
- **MSW (Mock Service Worker)** for mocking Supabase REST/auth/storage, Giphy, and Claude API calls — handlers in `src/test/mocks/handlers.js`, Node server wired into `src/test/setup.js`
- **Playwright** (Chromium only, locally) for E2E

**Conventions:**
- Co-locate component/page tests next to the file: `Foo.jsx` → `Foo.test.jsx`
- Shared setup, mocks, and fixtures live in `src/test/`
- E2E specs live in `e2e/` at the project root; Vitest excludes this directory
- Test env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GIPHY_API_KEY`) are pinned in `vite.config.js` under `test.env` — keeps tests deterministic and points the Supabase client at `https://test.supabase.co` so MSW can intercept it
- MSW handlers reset between tests; override per-test with `server.use(...)` for scenario-specific responses
- `unhandledRequest: 'warn'` so unintended network calls surface as warnings, not silent passes
- Playwright auto-starts `npm run dev` via `webServer` and reuses it if already running

## Architecture

**Stack:** React 19 + React Router v7 + Vite 8 + vanilla CSS (dark theme). No TypeScript.

**Backend:** Supabase — auth (email/password + Google/GitHub OAuth), PostgreSQL database, file storage (resumes bucket).

**State management:** Centralized in `App.jsx` — `applications` array lives in `useState`, synced to Supabase via async functions. `session` from Supabase auth passed as props to pages. Messaging unread state (`unreadMap`) also lives in `App.jsx` so the nav badge and the Connections list share a single source of truth and one realtime subscription. No external state library.

**Data model (Supabase tables):**
- `application` — `{ id, user_id, company, role, data (date), status, notes, resume_url }` where status is `"applied" | "interview" | "rejected"`
- `profiles` — `{ id (FK to auth.users), username, full_name, bio, avatar_url, created_at }` — auto-created on signup via DB trigger
- `connections` — `{ id, requester_id, receiver_id, status, created_at }` where status is `"pending" | "accepted" | "declined"`
- `user_settings` — stores `weeklyGoal` per user
- `conversations` — `{ id, created_at }` — one row per 1:1 thread
- `conversation_participants` — `{ conversation_id, user_id, last_read_at }` — membership + per-user read cursor
- `messages` — `{ id, conversation_id, sender_id, content, message_type, attachment_url, created_at }` where `message_type` is `"text" | "image" | "gif"`

**Supabase RPCs (all `SECURITY DEFINER`):**
- `get_or_create_conversation(other_user_id uuid) → uuid` — finds an existing 1:1 conversation with the other user regardless of who initiated, creates one if none exists
- `get_unread_conversations() → setof (conversation_id, other_user_id, has_unread)` — per-conversation unread flag for the calling user; a single other user can appear in multiple rows if there are duplicate threads, so client code must OR `has_unread` per user when building the map
- `is_conversation_participant(conv_id, uid) → boolean` — membership check used inside RLS policies to avoid recursion (see Key Patterns)

**Storage:** Two Supabase Storage buckets:
- `resumes` — `{user_id}/{application_id}-{filename}`, signed URLs (60s expiry)
- `chat-attachments` — `{user_id}/{uuid}-{filename}` for image messages, signed URLs (3600s expiry)

**Routing:** `createBrowserRouter` in `App.jsx` with `Layout` as parent route (sidebar/nav + `<Outlet />`). Routes:
- `/` — Home (dashboard overview)
- `/applied` — Applications list/kanban with CRUD, search, filter, drag-and-drop
- `/analytics` — Charts and weekly goal
- `/profile/me` — Own profile (editable)
- `/profile/:username` — Other user's profile (view only, stats gated behind connection)
- `/discover` — Browse/search users, send connection requests
- `/connections` — Accepted connections list with inline chat (renders `<ChatView>` side-panel on desktop, full-screen on mobile)
- `*` — Error page

**Auth:** Supabase auth with email/password, Google OAuth, and GitHub OAuth. Login page at `src/pages/Login.jsx`. Session managed in `App.jsx` via `supabase.auth.onAuthStateChange`.

**Key libraries:**
- **Supabase JS** — auth, database, storage, realtime
- **Motion** (framer-motion successor) — page transitions, modal animations
- **Recharts** — bar/pie charts on Analytics page
- **Lucide React** — icons
- **emoji-picker-react** — emoji picker in `ChatView`
- **Giphy API** (REST) — GIF search, gated by `VITE_GIPHY_API_KEY`; picker is hidden when unset

**Styling:** Per-component CSS files, dark theme (`#0a0f1e` bg). Mobile breakpoint at 430px — sidebar becomes bottom nav, tables become cards. Logout button moves to mobile header on small screens.

## Key Patterns

- Application form uses a fixed-position modal with backdrop blur
- Kanban board uses HTML5 drag-and-drop on desktop + touch events (via `useEffect` with `{ passive: false }`) on mobile
- Resume upload happens after application creation — needs the app ID for the storage path
- Connection privacy: application stats on profiles are only visible to the user themselves or accepted connections
- Discover page filters out already-connected users
- Supabase FK joins may fail with hint syntax — use separate queries + `.in()` instead
- **RLS recursion trap:** policies on `conversation_participants` cannot query `conversation_participants` directly (infinite recursion). Policies on `messages` and `conversations` use the `is_conversation_participant(conv_id, uid)` `SECURITY DEFINER` helper, which bypasses RLS to break the cycle. The policy on `conversation_participants` itself only compares `user_id = auth.uid()`.
- **Realtime requires the publication:** postgres changes events only fire for tables in `supabase_realtime`. The `messages` table must be added via `alter publication supabase_realtime add table public.messages;` — easy to miss because the REST queries still work without it.
- **Unread map must OR across rows:** `get_unread_conversations` can return multiple rows per other user (one per conversation). The client in `App.jsx` OR-s `has_unread` per `other_user_id` so any unread conversation flags the user.
- **Mark-as-read flow:** opening `ChatView` calls `update conversation_participants set last_read_at = now()`; it also calls the `onMarkedRead(otherUserId)` prop, which walks back up to `App.jsx`'s `markUnreadRead` to clear the badge locally without waiting for a round-trip.
- **Deep-link to a chat:** `/profile/:username` "Message" button navigates to `/connections` with `state.openChatWith = profile.id`. `Connections.jsx` reads `location.state` once (tracked by a ref) and opens the matching `ChatView`.
- **GIF picker (Giphy):** request `fixed_width_downsampled` image variants; layout uses CSS `column-count: 2` masonry so tiles keep their natural aspect ratios. The sent GIF uses Giphy's `fixed_height` URL directly — no storage upload.
- **Image messages use `chat-attachments` bucket:** the `attachment_url` column stores the storage path, not a public URL. `ChatView` resolves it to a signed URL at render time via the `AttachmentImage` component.
