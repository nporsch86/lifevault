# Lifevault — Architecture Plan

## Overview
Lifevault is a digital life planner — daily/weekly/monthly views, to-do lists with auto-rollover, expense tracking, links with alerts, meeting notes, confidential calendar, and template marketplace. Works on tablet with stylus, synced across devices.

## Cross-Platform Strategy (Android + iOS)
The frontend is built as a **Progressive Web App (PWA)** using Vite + React + vite-plugin-pwa, which works natively on both Android and iOS:
- **Installable** to home screen on both platforms
- **Offline support** via service workers
- **Touch & stylus input** via HTML Canvas API
- **Push notifications** supported on Android (and iOS 16.4+)

For native App Store / Play Store distribution in the future, the same codebase can be wrapped with **Capacitor** (by Ionic) — this enables native biometric auth (Face ID, fingerprint), native push notifications, and full app store presence while sharing 100% of the React code.

## Tech Stack (Proposed)

### Frontend
- **Framework:** React 18+ with Vite (responsive web app)
- **Styling:** Tailwind CSS
- **Tablet/Stylus:** HTML Canvas API or a handwriting library for freeform notes
- **State:** React Context + local storage for offline
- **PWA:** Service worker for offline support

### Backend / API
- **Runtime:** Node.js with Hono or Express
- **API Design:** RESTful JSON API
- **Auth:** JWT-based (Clerk or Supabase Auth)

### Database
- **Primary:** Turso (edge-hosted SQLite) — local-first with cloud sync, ideal for offline-capable planner
- **Alternative:** Neon (serverless Postgres)

### Sync
- Local-first architecture: data stored locally, synced to cloud when online
- CRDT or last-write-wins conflict resolution for offline edits

### Hosting
- **Frontend:** Vercel or Cloudflare Pages
- **Backend:** Vercel Serverless Functions or Cloudflare Workers

## Database Schema (Initial Draft)

### users
- id (uuid, PK)
- email (unique)
- name
- password_hash
- created_at
- subscription_tier (free / premium / lifetime)
- biometric_enabled (bool)

### calendars
- id (uuid, PK)
- user_id (FK)
- name (e.g., "Work", "Personal", "Family")
- color (hex)
- is_confidential (bool)
- created_at

### events
- id (uuid, PK)
- calendar_id (FK)
- user_id (FK)
- title
- description
- start_time / end_time
- is_all_day (bool)
- meeting_link (text, nullable)
- meeting_notes (text, nullable)
- alert_minutes_before (int)
- created_at / updated_at
- sync_status (local / synced)

### tasks
- id (uuid, PK)
- user_id (FK)
- title
- description
- due_date
- priority (high / medium / low)
- status (pending / completed)
- is_recurring (bool)
- recurring_interval (daily / weekly / monthly)
- category (work / personal / family / health)
- original_date (date — for tracking rollovers)
- created_at / updated_at

### task_rollovers (tracks auto-roll history)
- id (uuid, PK)
- task_id (FK)
- rolled_from_date (date)
- rolled_to_date (date)
- created_at

### expenses
- id (uuid, PK)
- user_id (FK)
- amount (decimal)
- category (food / transport / bills / etc.)
- description
- date
- created_at

### links
- id (uuid, PK)
- user_id (FK)
- url
- title
- notes
- alert_at (datetime, nullable)
- triggered (bool)
- created_at

### templates
- id (uuid, PK)
- name
- description
- type (free / paid)
- price (decimal, 0 for free)
- content (JSON — template structure)
- author_id (FK, nullable)
- downloads (int)
- created_at

### notes
- id (uuid, PK)
- user_id (FK)
- event_id (FK, nullable)
- title
- content (rich text / handwriting data)
- is_handwritten (bool)
- created_at / updated_at

## Key Flows

### To-Do Auto-Rollover
Each night at midnight (or on next app open), any task with status "pending" and due_date < today gets:
1. Original task archived with completion_status = "rolled"
2. New task created with same title/details but due_date = today
3. Entry added to task_rollovers table

### Confidential Calendar
- Events in calendars with `is_confidential = true` are hidden behind a biometric lock (Face ID / fingerprint on mobile, password on web)
- Events show as "Private Event" or are blurred in previews
- API returns confidential events only after biometric auth token is verified

### Calendar Sync (Google / Apple)
- OAuth 2.0 flow for Google Calendar
- Caldav for Apple Calendar
- Two-way sync with conflict resolution
- Sync runs in background on app open and periodically

## Project Structure
```
lifevault/
├── frontend/          # React + Vite web app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── store/        # State management
│   │   ├── utils/        # Helpers
│   │   └── styles/       # Global styles
│   ├── public/
│   └── package.json
├── backend/           # Node.js API
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── middleware/   # Auth, validation
│   │   ├── models/       # DB models/queries
│   │   └── services/    # Business logic
│   ├── migrations/      # DB schema migrations
│   └── package.json
└── shared/            # Shared types, schemas
    ├── types/           # TypeScript types
    └── constants/       # Shared constants
```

## Milestones
1. **MVP** — Daily planner, to-do list with rollover, basic calendar views, auth
2. **v1.0** — Weekly/monthly views, expense tracking, links with alerts, confidential calendar, sync
3. **v1.5** — Tablet/stylus handwriting, template marketplace, goal tracking
4. **v2.0** — Google/Apple calendar sync, team plans, wellness tracker, export to PDF