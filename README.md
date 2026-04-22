# JobTrackr

A full-stack job application tracker with social networking features. Track applications, upload resumes, connect with other job seekers, and monitor your progress — all in a polished dark-themed UI.

## Live Demo

https://job-trackr-umber.vercel.app/

## Features

### Application Tracking
- Log job applications with company, role, date, status, notes, and resume
- List view and Kanban board view with drag-and-drop (works on desktop and mobile)
- Inline status updates — Applied, Interview, Rejected
- Search and filter applications by company, role, or status
- Export applications to CSV
- Resume upload (PDF, DOC, DOCX) with Supabase Storage — view via signed URLs

### Dashboard & Analytics
- Dashboard overview with application counts at a glance
- Weekly application trends (bar chart), status breakdown (pie chart)
- Application streak tracker and weekly goal setting

### Social / Networking
- User profiles with bio, avatar, and application stats
- Discover page to browse and search other users
- LinkedIn-style mutual connections — send requests, accept/decline
- Application stats are private — only visible to the user and their connections

### Auth
- Email/password signup and login
- Google and GitHub OAuth
- Loading states and error handling throughout

### Design
- Dark theme with polished UI
- Fully responsive — desktop sidebar becomes mobile bottom nav
- Smooth page transitions and animations

## Tech Stack

- **React 19** + **React Router v7**
- **Vite 8** — build tooling
- **Supabase** — auth, PostgreSQL database, file storage
- **Recharts** — charts and analytics
- **Motion** (Framer Motion) — animations
- **Lucide React** — icons
- **Vanilla CSS** — per-component, dark theme

## Running Locally

```bash
git clone https://github.com/Prriiitttt/jobtrackr
cd jobtrackr
npm install
npm run dev
```

Create a `.env` file with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## What I Learned

Built this from scratch, evolving it from a localStorage-only app to a full Supabase-backed platform. Went deep on React Router nested routing, Supabase auth (OAuth + email), real-time database patterns, file storage with signed URLs, drag-and-drop (HTML5 + touch events for mobile), responsive design, and CSS Grid. First project where I built a social layer with mutual connections and privacy controls.