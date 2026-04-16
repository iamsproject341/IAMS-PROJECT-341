[README.md](https://github.com/user-attachments/files/26783673/README.md)
# AttachFlow — Industrial Attachment Management System (IAMS)

A centralized web platform that connects students with host organizations, automates placement matching, and digitizes the entire industrial attachment workflow — from registration to weekly logbook submission.

> Built for the **IAMS Project 341** coursework, with a focus on the Botswana tertiary education context (Gaborone, Francistown, Maun, etc.).

**Live demo:** https://iamsproject341.github.io/IAMS-PROJECT-341

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [User Roles](#user-roles)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Smart Matching Algorithm](#smart-matching-algorithm)
8. [Getting Started](#getting-started)
9. [Environment & Configuration](#environment--configuration)
10. [Available Scripts](#available-scripts)
11. [Deployment](#deployment)
12. [Security Notes](#security-notes)
13. [License](#license)

---

## Overview

Industrial attachment (also called internships or work-integrated learning) is a critical component of many tertiary programs, but the placement process is often manual, paper-based, and slow. **AttachFlow** replaces that with a single platform where:

- **Students** register, declare their skills and preferences, and submit weekly logbooks online.
- **Organizations** declare the kinds of students they want to host.
- **Coordinators** run an automated matching algorithm and approve placements with one click.
- **Supervisors** track student progress digitally.

The whole flow — registration → preferences → matching → placement → weekly logbooks — happens inside one app.

---

## Key Features

- **Smart matching algorithm** — scores every student-organization pair (0–100) based on overlapping skills, project types, and location preferences.
- **Digital weekly logbooks** — students submit weekly entries (activities, skills learned, challenges, next-week plan) that supervisors and coordinators can review.
- **Role-based dashboards** — separate UI and permissions for students, organizations, coordinators, and supervisors.
- **Admin console** — coordinators can create accounts for organizations, supervisors, and other coordinators, with auto-generated passwords.
- **Row Level Security (RLS)** — Supabase RLS policies enforce that users only see their own data unless they have an elevated role.
- **Animated landing page** — slideshow hero, scroll-reveal feature cards, and a logo intro animation.
- **Toast notifications** for all success/error feedback (via `react-hot-toast`).
- **Form validation** — shared validators for names, emails, student IDs, phone numbers, and passwords (Botswana-style phone format supported).
- **Session protection** — fresh browser sessions clear stored auth so users must log in again.

---

## User Roles

| Role | Capabilities |
|---|---|
| **Student** | Self-register; set skills/project/location preferences; view matches; submit weekly logbooks. |
| **Organization** | Account created by coordinator; set desired skills, project types, location, and number of students wanted; receive matched candidates. |
| **Coordinator** | Full admin access. Creates non-student accounts, runs the matching engine, approves/rejects matches, reviews all logbooks. |
| **Supervisor** | Account created by coordinator; reads logbooks and tracks student progress. |

Only the **student** role is publicly self-registerable. All other accounts are provisioned by a coordinator from the Admin page.

---

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) (Create React App / `react-scripts` 5)
- [React Router v7](https://reactrouter.com/) for client-side routing
- [Framer Motion](https://www.framer.com/motion/) for page transitions
- [Lucide React](https://lucide.dev/) for icons
- [react-hot-toast](https://react-hot-toast.com/) for notifications
- Plain CSS (no Tailwind/CSS-in-JS) — see `src/styles/`

**Backend / Database**
- [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS)
- `@supabase/supabase-js` v2 client

**Deployment**
- [GitHub Pages](https://pages.github.com/) via the `gh-pages` package

---

## Project Structure

```
IAMS-PROJECT-341/
├── public/
│   ├── images/              # Landing page slideshow images
│   ├── 404.html             # GitHub Pages SPA fallback
│   ├── favicon.svg
│   └── index.html
├── src/
│   ├── components/          # Reusable UI bits
│   │   ├── AnimatedCard.js
│   │   ├── Logo.js
│   │   └── PageTransition.js
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.js   # Session + profile state, signUp/signIn/signOut
│   │   └── ThemeContext.js
│   ├── layouts/
│   │   └── DashboardLayout.js   # Sidebar + outlet for authenticated pages
│   ├── lib/
│   │   └── supabase.js      # Supabase client setup (regular + admin)
│   ├── pages/               # One file per route
│   │   ├── LandingPage.js
│   │   ├── AuthSplitPage.js
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   ├── VerifyPage.js
│   │   ├── DashboardHome.js
│   │   ├── StudentPreferences.js
│   │   ├── OrgPreferences.js
│   │   ├── LogbookPage.js
│   │   ├── MatchingPage.js
│   │   ├── ProfilePage.js
│   │   └── AdminPage.js
│   ├── styles/
│   │   ├── index.css        # Global styles, design tokens, components
│   │   └── animations.css   # Keyframes and reveal animations
│   ├── utils/
│   │   └── validators.js    # Shared form validation helpers
│   ├── App.js               # Router + ProtectedRoute / PublicRoute guards
│   └── index.js             # Entry point
├── supabase_migration.sql   # Full database schema + RLS policies
├── package.json
└── README.md
```

---

## Database Schema

The full schema lives in [`supabase_migration.sql`](./supabase_migration.sql). Tables:

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users` with `full_name`, `role`, `phone`, `student_id`. Auto-created on signup via a trigger. |
| `student_preferences` | A student's chosen skills (text array), project types, locations, and notes. One row per student. |
| `org_preferences` | An organization's desired skills, project types, location, headcount, and description. One row per org. |
| `matches` | A scored student-organization pair with status: `pending` / `approved` / `rejected`. |
| `logbooks` | Weekly student entries: `week_number`, `week_starting`, `activities_performed`, `skills_learned`, `challenges`, `next_week_plan`. |

**Row Level Security (RLS) is enabled on every table.** Highlights:
- Profiles are world-readable but only updatable by the owner.
- Students manage their own preferences and logbooks; coordinators can read everything.
- Matches are managed by coordinators; students and organizations can read only matches they're part of.

---

## Smart Matching Algorithm

The coordinator runs the algorithm from the **Matching** page. For every (unmatched student × organization) pair, it computes a score out of **100**:

| Component | Max Points | How it's calculated |
|---|---|---|
| **Skills overlap** | 50 | `(matched_skills / org_desired_skills) × 50` |
| **Project type overlap** | 30 | `(matched_project_types / org_project_types) × 30` |
| **Location match** | 20 | 20 if the student listed the org's location (or chose "Any Location"), else 0 |

Students already in an `approved` match are excluded from re-matching. The coordinator reviews the ranked list and approves or rejects each pairing — approval is what unlocks the logbook for the student.

---

## Getting Started

### Prerequisites
- **Node.js** 18 or newer
- **npm** (comes with Node)
- A **Supabase** project (free tier is fine)

### 1. Clone and install

```bash
git clone https://github.com/iamsproject341/IAMS-PROJECT-341.git
cd IAMS-PROJECT-341
npm install
```

### 2. Set up the database

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the entire contents of [`supabase_migration.sql`](./supabase_migration.sql) and run it. This creates all tables, the auto-profile trigger, and RLS policies.
4. (Optional) In **Authentication → Providers**, configure email confirmation behavior to match your needs.

### 3. Configure the Supabase client

Open `src/lib/supabase.js` and replace the existing `supabaseUrl` and `supabaseAnonKey` with the values from your own Supabase project (**Settings → API**).

> ⚠️ **Important:** the file currently also contains an obfuscated `service_role` key used for admin operations from the coordinator's Admin page. See [Security Notes](#security-notes) below — for any production use, this **must** be moved to a secure backend (e.g. a Supabase Edge Function) and not shipped to the browser.

### 4. Run locally

```bash
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

---

## Environment & Configuration

This project does not use a `.env` file out of the box — Supabase credentials are imported directly from `src/lib/supabase.js`. If you fork this for your own use, the cleanest change is:

```js
// src/lib/supabase.js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

…and then create a `.env.local`:

```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Remember that any `REACT_APP_*` variable in CRA is bundled into the client — never put a `service_role` key there.

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm start` | Runs the dev server at `localhost:3000` with hot reload. |
| `npm run build` | Produces an optimized production build in `build/`. |
| `npm run deploy` | Builds and publishes `build/` to the `gh-pages` branch. |
| `npm run predeploy` | Runs automatically before `deploy` — just calls `build`. |

---

## Deployment

The project is configured for **GitHub Pages** deployment via the `homepage` field in `package.json`:

```json
"homepage": "https://iamsproject341.github.io/IAMS-PROJECT-341"
```

To deploy your own fork:

1. Update the `homepage` field to match your GitHub Pages URL.
2. Run:
   ```bash
   npm run deploy
   ```
3. In your repo's **Settings → Pages**, set the source to the `gh-pages` branch.

The included `public/404.html` handles SPA routing fallbacks so React Router works correctly on GitHub Pages.

---

## Security Notes

A few things to be aware of before extending this project:

- **The Supabase keys in `src/lib/supabase.js` are committed to the repo.** The anon key is intended to be public (RLS is what protects your data), but the obfuscated admin key in `_dk()` is **not safe** in a real production app — anyone can deobfuscate it from the bundled JS. For coursework/demo this is fine; for production, move all admin operations (creating accounts, running matches with elevated privileges) into a [Supabase Edge Function](https://supabase.com/docs/guides/functions) or other server-side endpoint.
- **Row Level Security is the primary defence.** Make sure you don't disable RLS on any table.
- **Email confirmation** is bypassed when accounts are created from the coordinator's Admin page (using the admin client). Self-registered students still go through the normal email verification flow.

---

## License

This project was developed as part of academic coursework (IAMS Project 341). No formal license has been declared — please contact the project authors before reusing the code beyond personal study.

---

## Acknowledgements

- **Supabase** for the backend-as-a-service.
- **Lucide** for the icon set.
- **Framer Motion** for the page transitions.
- The IAMS Project 341 team for the design and product direction.
