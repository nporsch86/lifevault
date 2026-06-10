# Lifevault — UX/Product Design Document

## Overview

Lifevault is a digital life planner that replaces paper with smart everything. This document captures the complete UX design — from low-fidelity wireframes through high-fidelity mockups — for all core screens and branding.

---

## Logo Design — Open Book + Lock

### Concept
The Lifevault logo combines an **open book** (representing knowledge, planning, life stories) with a **padlock** (representing security, privacy, the "vault" concept). Together they communicate: *"Your life, securely organized in one place."*

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Deep Navy | `#0f172a` | Primary background / book base |
| Cyan-Teal | `#06b6d4` | Primary accent — lock, page edges |
| Light Blue | `#38bdf8` | Secondary highlight |
| Soft Cyan | `#7dd3fc` | Tagline text, subtle accents |

*Note: The original gold (#f0a500) palette was replaced with blue/teal/cyan at the owner's request.*

### Logo Versions
| File | Size | Usage |
|------|------|-------|
| `designs/logo/logo-full.png` | 1536x1024 | Full brand logo with "Lifevault" text + tagline "ONE VAULT. YOUR WHOLE LIFE." |
| `designs/logo/logo-icon-512.png` | 1024x1024 | App store icon, home screen icon |
| `designs/logo/logo-icon-192.png` | 1024x1024 | PWA manifest icon (resize to 192x192 for production) |
| `designs/logo/logo-sidebar.png` | 1536x1024 | Horizontal lockup for sidebar navigation header |

### Design Rationale
- **Open book** = your life story, daily planning, knowledge
- **Lock** = security, privacy, the "vault" promise
- **Blue/teal palette** = trust, calm, professionalism — aligns with productivity apps
- **Minimal shapes** = scales cleanly from 192px PWA icon to full branding
- **No text on icon versions** = works internationally, no localization needed for app icon

---

## Design System

### Visual Identity
- **Brand Personality:** Warm, premium, trustworthy, organized
- **Tone:** Calm and empowering — the app should feel like a personal assistant, not a taskmaster
- **Target Device:** Tablet (iPad, Android tablet) with stylus support, synced to phone/desktop

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Navy Dark | `#1a1a2e` | Primary background (dark mode) |
| Warm Gold | `#f0a500` | Primary accent, CTAs, premium indicators |
| White | `#ffffff` | Text on dark backgrounds |
| Soft Cream | `#f8f4e3` | Light mode background |
| Teal | `#0fbfa8` | Success, complete, connected states |
| Purple | `#7c3aed` | Confidential/private events and sections |
| Red | `#ef4444` | Overdue items, alerts, errors |
| Amber | `#f59e0b` | Rolled-over items, mid-priority |

### Typography
- **Primary:** SF Pro (iOS) / Roboto (Android) — clean, highly legible at small sizes
- **Headings:** Semi-bold, 18–28px
- **Body:** Regular, 14–16px
- **Calendar dates:** Medium weight, 12–14px

### Iconography
- Line-art style with 2px stroke weight
- Gold highlight on active/selected states
- Consistent 24x24px grid for tab bar icons

### Spacing Grid
- Base unit: 8px
- Content padding: 24px
- Card padding: 16px
- Between sections: 32px

---

## Screen-by-Screen Design

**Note:** The lead's original specification lists 11 screens. I have designed 11 screens total — the original 10 plus the Smart Daily Agenda (below). See the lead's first message for the complete list.

### 1. Login & Onboarding
**Files:** `wireframe-01-login-onboarding.png`, `mockup-01-login-onboarding.png`

**Purpose:** First impression. Onboard quickly and set up biometric security.

**Key Elements:**
- Lifevault logo (vault + calendar icon fusion) with tagline "One vault for your whole life"
- Social sign-in options (Apple, Google, Email) — reduce friction
- Biometric fingerprint prompt for confidential vault setup (introduces the USP early)

**Design Rationale:**
- Three sign-in options max to avoid choice paralysis
- Biometric prompt on onboarding sets the expectation that Lifevault takes privacy seriously
- Warm dark background feels premium and serious — not a toy

**States:**
- Default: sign-in options visible
- Post-sign-in: biometric enrollment overlay (Face ID / fingerprint)
- Returning user: face/fingerprint quick-auth (skips sign-in)

---

### 2. Daily Planner View
**Files:** `wireframe-02-daily-planner.png`, `mockup-02-daily-planner.png`

**Purpose:** The primary screen — where users spend most of their time.

**Key Elements:**
- Left 60%: Timeline view (6 AM–10 PM) with color-coded event blocks
- Right 40%: To-do panel with auto-rollover indicator
- Bottom: Handwriting/drawing canvas area for quick stylus notes
- Top bar: date, navigation arrows, menu

**Design Rationale:**
- Split layout mirrors a physical planner (calendar left, tasks right)
- Auto-rollover indicator ("3 tasks rolled over from yesterday") in warm amber — gentle reminder, not a guilt trip
- Stylus handwriting zone at the bottom — always accessible, never more than a tap away
- Color coding for events: blue=work, green=personal, gold=important, purple=confidential

**States:**
- Empty day (no events): Show "Your day is clear — add an event or task" gentle prompt
- Busy day: Stacked event blocks with time conflicts shown as overlapping red borders
- Past day: Dimmed with "Day complete" summary at top

---

### 3. Weekly Planner View
**Files:** `wireframe-03-weekly-planner.png`, `mockup-03-weekly-planner.png`

**Purpose:** Bird's-eye view of the week for planning and prioritization.

**Key Elements:**
- 7-column grid (Mon–Sun), landscape orientation
- Each column: date header + stacked event/task cards
- Left sidebar: "This Week's Focus" with 3 priority items
- Top navigation: week selector arrows + view toggle (Day | Week | Month)

**Design Rationale:**
- Landscape is deliberately chosen — 7 columns need horizontal space
- "This Week's Focus" sidebar prevents the weekly view from being just a calendar — it's a planning tool
- View toggle makes switching between time scales frictionless

**States:**
- Current week: Today's column highlighted with gold border
- Past days: Dimmed text, strikethrough completed tasks
- Empty days: Subtle dotted placeholder, tap to add

---

### 4. Monthly Overview
**Files:** `wireframe-04-monthly-overview.png`, `mockup-04-monthly-overview.png`

**Purpose:** Big-picture planning and navigation.

**Key Elements:**
- Full calendar grid (5 weeks) with date numbers and event dots
- Left panel: "Upcoming Events" list + "Monthly Budget Summary" with donut chart
- Top: month/year title, arrows, "Today" button

**Design Rationale:**
- Event dots (not text) keep the grid clean and scannable
- Side panel shows actual event titles without cluttering the grid
- Budget summary in the monthly view ties expense tracking to the calendar context

**States:**
- Current month with events: Colored dots in date cells
- Empty month: Minimal grid, "No events this month" in side panel
- Months with many events: Compact mode with smaller dots

---

### 5. To-Do List Panel
**Files:** `wireframe-05-todo-list.png`, `mockup-05-todo-list.png`

**Purpose:** Dedicated task management with intelligent auto-rollover.

**Key Elements:**
- Sections: Overdue (red), Today (white), Tomorrow (subtle), This Week (dimmed)
- Each task: checkbox, description, priority tag, linked calendar icon
- Auto-rollover toggle (ON by default) with rollover count badge
- Quick add input bar at bottom

**Design Rationale:**
- Auto-rollover is the headline feature — unfinished tasks carry forward automatically
- Color intensity decreases by time horizon (urgent → bright, distant → dimmed)
- Priority tags (High/Med/Low in red/amber/green) enable quick filtering
- Overdue items show "Rolled over from yesterday" — frames it as a carry-forward, not failure

**States:**
- Empty: "All caught up! 🎉" celebration screen
- Overdue: Red section at top, items show rollover count badge
- Completed: Checked tasks get gold checkmark + strikethrough, fade out after 24h

---

### 6. Expense Tracker
**Files:** `wireframe-06-expense-tracker.png`, `mockup-06-expense-tracker.png`

**Purpose:** Simple, glanceable expense logging within the planner context.

**Key Elements:**
- Top summary cards: Income, Expenses, Balance
- Simple bar chart showing daily spending trend
- Categorized expense log (Food, Transport, Shopping, Bills, etc.)
- Quick Add form: amount, category, note, date

**Design Rationale:**
- Not a full finance app — it's a lightweight tracker that lives inside the planner
- Summary cards at top give instant snapshot without scrolling
- Category colors enable visual scanning
- Quick Add is a single tap away (no navigation to a separate screen)

**States:**
- Empty month: "Start tracking your expenses" with one-tap first entry
- Over budget: Red warning banner "You've spent 85% of your monthly budget"
- Recurring expenses: Auto-detected with recurring badge

---

### 7. Confidential Calendar
**Files:** `wireframe-07-confidential-calendar.png`, `mockup-07-confidential-calendar.png`

**Purpose:** Biometric-locked private calendar — the key differentiator and privacy feature.

**Key Elements:**
- Locked state: Blurred events with fingerprint/face ID unlock prompt
- Unlocked state: Purple-colored events with lock icons, visible as normal
- Split-screen comparison (wireframe shows both states side by side)

**Design Rationale:**
- Biometric lock (Face ID / fingerprint) before viewing — not just a passcode
- Blurred events in locked state signal "something is hidden here" without revealing details
- Purple color distinguishes confidential from regular events at a glance
- Critical for users who share their device or show their calendar to others

**States:**
- Locked: All events blurred, "Unlock with biometrics" overlay
- Unlocked: Confidential events visible in purple with small lock icon
- No confidential events: Section hidden or shows "Add a confidential event" with lock icon
- Biometric failure: Fallback to passcode/PIN

---

### 8. Meeting Notes
**Files:** `wireframe-08-meeting-notes.png`, `mockup-08-meeting-notes.png`

**Purpose:** Capture notes during meetings and link them to calendar events.

**Key Elements:**
- Top: Calendar event card (title, time, attendees, location/link)
- Center: Handwriting/drawing canvas with stylus support
- Annotation tools: Pen, highlighter, eraser, text, color picker
- "Link to Event" button to attach notes to the calendar entry

**Design Rationale:**
- Meeting context is always visible at the top — never forget which meeting you're noting
- Handwriting-first for tablet + stylus users, with text tool as fallback
- Link to Event creates a two-way connection: open the event to see notes, open notes to see event
- Highlighted action items can be auto-detected and added to to-do list

**States:**
- New meeting: Empty canvas with meeting info at top
- With notes: Handwriting, sketches, highlights on canvas
- Linked to event: "Linked to Sprint Planning" badge
- No meeting context: Freeform notes mode (just canvas, no event card)

---

### 9. Template Marketplace
**Files:** `wireframe-09-template-marketplace.png`, `mockup-09-template-marketplace.png`

**Purpose:** Revenue driver — sell specialized planner templates.

**Key Elements:**
- Search bar + filter chips: All, Popular, New, Budget, Student, etc.
- Featured hero card (rotating promotions)
- 2-column grid of template cards with thumbnail, title, rating, price
- Free vs Paid badges

**Design Rationale:**
- Featured template at top drives conversions to highest-margin items
- Filter chips reduce friction — users find their category immediately
- "Preview" button builds trust before purchase
- Free templates act as lead magnets (e.g., "Weekly Planner Free") — upsell to premium

**Pricing Display:**
- Monthly premium features: Shown as "Premium" badge (requires $7.99/mo subscription)
- Individual templates: "$4.99" with "Buy" button
- Bundle discount: "Get 3 for $9.99" promotion card

**States:**
- Browsing: Grid of templates with filters
- Searching: Results with "No results" empty state and suggestions
- Purchased: "Downloaded" green badge, available in user's templates

---

### 10. Settings & Sync Configuration
**Files:** `wireframe-10-settings-sync.png`, `mockup-10-settings-sync.png`

**Purpose:** Account management, calendar sync, security, and subscription.

**Key Elements:**
- Account section: Avatar, name, email, plan badge
- Calendar Sync: Google Calendar (connected/disconnected), Apple Calendar (connected/disconnected)
- Security: Biometric lock toggle, confidential vault config
- Backup: Cloud backup toggle with "Last backed up" timestamp
- Appearance: Dark/Light mode toggle
- Subscription: Current plan card + upgrade options

**Design Rationale:**
- Calendar sync is the most critical setting — placed high in the list
- Connection status is visually clear: green dot + "Connected" or gray + "Tap to connect"
- Biometric lock toggle is separate from general security — users may want biometrics for the app itself vs only for the confidential vault
- Subscription section shows both current plan and upgrade path, making upsell easy

**States:**
- Fresh install: All sync disconnected, biometrics not configured
- Premium user: Gold "Premium" badge, all features enabled
- Free user: "Upgrade to Premium" gold button, some toggles disabled with lock icon
- Sync connected: Green status with account email shown beneath

### 11. Smart Daily Agenda (Morning Summary)
**Files:** `wireframe-11-smart-daily-agenda.png`, `mockup-11-smart-daily-agenda.png`

**Purpose:** The first screen users see each morning — a personalized daily briefing that sets the tone and priorities for the day ahead.

**Key Elements:**
- Personalized greeting: "Good Morning, Jamie!" with current weather widget
- Today's Highlights: Top 3 priority tasks + first calendar event of the day
- Quick Glance stats row: event count, task count, expenses logged
- Focus Time block: Protected no-meeting window for deep work
- "Start Your Day" call-to-action button

**Design Rationale:**
- This is the emotional anchor of the app — the morning greeting makes it feel personal, not robotic
- Quick Glance stats are glanceable at a 2-second scan — gives the user a sense of control before diving in
- Focus Time is a proactive feature: the app suggests protecting time, the user doesn't have to think about it
- "Start Your Day" button is a gentle ritual — creates a deliberate transition from browsing to doing
- Weather widget adds a practical touch (should I take an umbrella?) while making the screen feel alive

**States:**
- Morning (first open of the day): Full greeting, "Start Your Day" button prominent
- Afternoon revisit: "Good Afternoon" greeting, summary of what's been done vs remaining
- Empty day: "Your day looks clear — want to add something?" with suggestion prompts
- High-stress day (many events + overdue tasks): Calmer color treatment, focus suggestions

---

## User Flows

### Primary Flow: Daily Planning
1. Open app → Biometric auth (or skip for basic view)
2. Daily planner view loads — today's timeline + tasks
3. Check rolled-over tasks from yesterday
4. Add new tasks via quick-add bar
5. Write stylus notes in handwriting zone
6. Mark tasks complete (auto-check with gold animation)

### Secondary Flow: Event + Notes
1. Tap a time slot in daily planner → Create event modal
2. Fill event details (title, time, attendees, location)
3. Tap "Add Notes" → Meeting notes canvas opens
4. Write meeting notes with stylus
5. Highlight action items → Auto-add to to-do list
6. Close → Event shows note-attachment indicator

### Tertiary Flow: Confidential
1. Tap confidential calendar tab
2. View is blurred → Fingerprint/face ID prompt
3. Authenticate → Events become visible in purple
4. Add confidential event (only accessible while authenticated)
5. Lock manually or auto-lock after 2 minutes of inactivity

### Revenue Flow: Template Purchase
1. Browse marketplace → Filter by category
2. Tap "Preview" → See template layout
3. Tap "Get — $4.99" → Purchase confirmation
4. Template added to user's template library
5. Apply template to planner → Layout loads with template structure

---

## Interaction Patterns

### Stylus Input
- Always-available handwriting zone on daily planner
- Full canvas in meeting notes with palm rejection
- Pen types: Ballpoint (thin), Marker (medium), Highlighter (wide, semi-transparent)
- Shape recognition: Draw a circle around text → converts to highlighted note

### Auto-Rollover (Key Differentiator)
- Every night at midnight, unfinished tasks roll to today
- Rolled tasks show "↻ Rolled over" badge with original date
- User can dismiss rollover for specific tasks (archive them)
- Rollover count shows in daily planner header as motivation metric

### Calendar Navigation
- Pinch-to-zoom: Daily ↔ Weekly ↔ Monthly (smooth transition)
- Swipe left/right: Next/prev day, week, or month
- Tap date: Jump to that day
- "Today" button: Quick return to current date

---

## Accessibility Considerations
- Dark mode default (reduces eye strain for daily use)
- All interactive elements have minimum 44x44pt touch targets
- Handwriting input supports screen reader via text overlay
- Color is never the only indicator — priority tags have text labels
- Biometric fallback: passcode/PIN for users without biometric hardware

---

## Next Steps / Future Work
- **Prototype:** Create clickable interactive prototype (Figma or Principle)
- **User Testing:** Test the daily planner and auto-rollover flow with 10 users
- **Animation Spec:** Define micro-interactions (task complete, view switch, rollover animation)
- **Responsive Design:** Adapt tablet layouts to phone form factor
- **Design System Handoff:** Create component library for engineers (colors, typography, spacing, icons)

---

## File Index

### Low-Fidelity Wireframes (conceptual — layout and flow only)
| File | Screen |
|------|--------|
| `designs/wireframe-01-login-onboarding.png` | Login & Onboarding |
| `designs/wireframe-02-daily-planner.png` | Daily Planner View |
| `designs/wireframe-03-weekly-planner.png` | Weekly Planner View |
| `designs/wireframe-04-monthly-overview.png` | Monthly Overview |
| `designs/wireframe-05-todo-list.png` | To-Do List Panel |
| `designs/wireframe-06-expense-tracker.png` | Expense Tracker |
| `designs/wireframe-07-confidential-calendar.png` | Confidential Calendar |
| `designs/wireframe-08-meeting-notes.png` | Meeting Notes |
| `designs/wireframe-09-template-marketplace.png` | Template Marketplace |
| `designs/wireframe-10-settings-sync.png` | Settings & Sync |
| `designs/wireframe-11-smart-daily-agenda.png` | Smart Daily Agenda |

### High-Fidelity Mockups (final visual design)
| File | Screen |
|------|--------|
| `designs/mockup-01-login-onboarding.png` | Login & Onboarding |
| `designs/mockup-02-daily-planner.png` | Daily Planner View |
| `designs/mockup-03-weekly-planner.png` | Weekly Planner View |
| `designs/mockup-04-monthly-overview.png` | Monthly Overview |
| `designs/mockup-05-todo-list.png` | To-Do List Panel |
| `designs/mockup-06-expense-tracker.png` | Expense Tracker |
| `designs/mockup-07-confidential-calendar.png` | Confidential Calendar |
| `designs/mockup-08-meeting-notes.png` | Meeting Notes |
| `designs/mockup-09-template-marketplace.png` | Template Marketplace |
| `designs/mockup-10-settings-sync.png` | Settings & Sync |
| `designs/mockup-11-smart-daily-agenda.png` | Smart Daily Agenda |