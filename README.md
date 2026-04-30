# JobTrackr

A job application tracker that doubles as a small social network for job seekers.

**Live demo:** https://job-trackr-umber.vercel.app/

Most people end up tracking their job search in a spreadsheet that becomes a mess by week three — wrong dates, lost resumes, missed follow-ups, and no idea which version of your CV you sent to which company. JobTrackr is what I wish existed when I am applying: a real app that keeps the data structured, lets you upload the actual resume you sent, and lets you see what other people in your network are doing without turning it into yet another performative feed. I built it because the problem is annoying and the existing tools either feel like a CRM or feel like nothing.

---

## Features

- **Application tracking** — CRUD with company, role, date, status, notes, and per-application resume upload; search, filter, and switch between list and kanban with a remembered preference; CSV export of the currently filtered view.
- **Authentication** — email + password, Google OAuth, GitHub OAuth, with full session management and avatar auto-population on first sign-in.
- **Social** — LinkedIn-style mutual connections, editable profiles, a Discover page to find people, and stats that are gated behind an accepted connection.
- **Real-time messaging** — 1-on-1 chat with text, emoji, image, and GIF support, typing indicators, unread badges, and read receipts, integrated into the Connections page instead of a separate Messages tab.
- **Analytics** — weekly goal, streak counter, per-week bar chart, and a status pie chart.
- **UX polish** — dark theme, mobile-first responsive layout (430px breakpoint), loading and empty states everywhere, hover/active feedback, and per-route error boundaries.

---

## Tech stack

### Frontend

| Tool |
|---|
| React 19 |
| React Router v7 |
| Vite 8 |
| Vanilla CSS |
| Lucide React |
| Motion |
| Recharts |
| emoji-picker-react |

### Backend / infra

| Tool |
|---|
| Supabase (Postgres, Auth, Storage, Realtime, RLS, RPC) |
| Vercel |
| Giphy API |

### Testing & QA

Vitest + React Testing Library + MSW for unit and component tests, Playwright for end-to-end. **288 tests across 24 files, 93%+ statement coverage.**

---

## Local setup

```bash
git clone https://github.com/<your-handle>/jobtrackr.git
cd jobtrackr/application-tracker
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GIPHY_API_KEY
npm run dev
```

You'll need a Supabase project. The schema, RLS policies, and RPC functions are documented in `docs/` — run them in the Supabase SQL editor before signing up, or sign-up will work but data access will silently fail.

---

## Testing

```bash
npm run test            # Vitest in watch mode
npm run test:coverage   # one-shot run with v8 coverage
npm run test:e2e        # Playwright (chromium + mobile-chrome)
```

288 tests cover the utility functions, every page component (happy path, empty, loading, error), accessibility audits via jest-axe, and end-to-end flows including a touch drag-and-drop test against a dev-only kanban harness route.

---

## What I learned

There's a big gap between "the feature works" and "the feature ships." I had a working messaging UI in two evenings — making it production-grade took longer than the original build. The RLS policies, the CSP, the error boundaries, the code splitting, the unread-state edge cases — none of that is visible to a user, but it's the difference between a demo and a product.

Tests caught bugs I'd never have found manually. The CSV export ignoring the active filter, `countByStatus` disagreeing with its per-status sums when an unknown status snuck in, the weekly goal silently showing 100% when divided by zero — all looked plausible until I had to write down in a test what the function *should* do. Writing tests first turned out to be a debugger I didn't know I needed.

The database surprised me twice. RLS recursion was a real trap — a naive policy on `conversation_participants` ("you can see participants of conversations you're in") loops on itself, and the unlock was a `SECURITY DEFINER` helper that bypasses RLS for one specific membership lookup. The second one was Realtime: events fire only for tables added to the `supabase_realtime` publication, but REST works without it, so the bug looked like "realtime is broken" when really nothing was enabled. Both are the kind of thing you only learn by hitting them.

Working with Claude was useful when I scoped the work and read every diff. The good runs were narrow asks like "extract this into a testable utility" or "write tests for this function." A few times the output looked right but missed an edge case I'd flagged earlier — that's when reviewing the diff line by line, not just the green checkmark, mattered. Treating it like a PR from a fast junior who needs review was the mental model that worked for me.

---

## Built with

Supabase did most of the heavy lifting on the backend. Vercel made deploys boring in the best way. Anthropic's Claude (used via Claude Code throughout development) paired with me on the harder parts.
