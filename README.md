# SkillBridge — Attendance Management System

A deployed, end-to-end prototype of a state-level skilling programme attendance system. Five distinct roles (Student, Trainer, Institution, Programme Manager, Monitoring Officer) each get their own dashboard with data drawn live from a PostgreSQL database.

---

## 1. Live URLs

| Layer | URL |
|---|---|
| **Frontend** | `[INSERT VERCEL URL AFTER DEPLOYMENT]` |
| **Backend API Base** | `[INSERT RAILWAY/RENDER URL AFTER DEPLOYMENT]/api` |
| **Database** | Neon PostgreSQL (connection via `DATABASE_URL` in backend env) |

> **Note:** Both the frontend and backend are running and fully functional in local development (see Section 3). Deployment to Vercel + Railway is the final step.

---

## 2. Test Accounts

Register the following accounts on the live app at `/sign-up`. On the onboarding screen, select the role indicated below. The Institution account **must be registered first** (Trainers link to an existing Institution).

| Role | Email | Password |
|---|---|---|
| Institution | `institution@skillbridge.test` | `Test@1234` |
| Trainer | `trainer@skillbridge.test` | `Test@1234` |
| Programme Manager | `manager@skillbridge.test` | `Test@1234` |
| Monitoring Officer | `officer@skillbridge.test` | `Test@1234` |
| Student | `student@skillbridge.test` | `Test@1234` |

**E2E Flow to verify the system works:**
1. Log in as **Institution** → note the Batch IDs listed
2. Log in as **Trainer** → Create a Batch → Generate Invite Link → Create a Session
3. Log in as **Student** → Paste the invite token → Join Batch → Mark Attendance on active session
4. Log in as **Programme Manager** → View all institution summaries → Click "Details" for drill-down
5. Log in as **Monitoring Officer** → Verify read-only view with no action buttons

---

## 3. Local Setup

### Prerequisites
- Node.js v18+
- A Clerk account with a project (for `CLERK_SECRET_KEY` and `VITE_CLERK_PUBLISHABLE_KEY`)
- A Neon PostgreSQL database (or any hosted PostgreSQL)

### Step 1 — Clone & install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Configure backend environment

Create `backend/.env`:

```env
PORT=3001
DATABASE_URL="your_neon_postgresql_connection_string"
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
```

### Step 3 — Configure frontend environment

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
VITE_API_URL=http://localhost:3001/api
```

### Step 4 — Initialise the database

Run the schema against your Neon database (one time only):

```bash
psql "your_neon_connection_string" -f backend/schema.sql
```

Or paste the contents of `backend/schema.sql` directly into the Neon SQL Editor.

### Step 5 — Start both servers

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 4. Schema Decisions

The schema uses 6 tables. Every key decision was made to keep the data model clean and enforce integrity at the database level, not just in application code.

| Table | Key Design Choice |
|---|---|
| `users` | Stores `clerk_user_id` (the Clerk JWT `sub` claim) as a `UNIQUE` column. This decouples our PostgreSQL identity from Clerk's identity — we never trust the frontend to tell us who the user is; we look it up from the verified Clerk user ID on every request. |
| `institutions` | Separate table so Trainers and Batches can have a clean foreign key reference. Institution users register their institution name on onboarding, which creates a row here. |
| `batch_trainers` | Many-to-many join table with a composite primary key `(batch_id, trainer_id)`. Supports multiple trainers per batch without data duplication. |
| `batch_students` | Same pattern as `batch_trainers`. The student join flow is token-gated: a student must present a valid invite token to populate this table. |
| `attendance` | Has a `UNIQUE(session_id, student_id)` constraint. This means if a student marks attendance twice (e.g., clicks "Late" then "Present"), the second mark issues an `ON CONFLICT DO UPDATE` — it corrects the record rather than crashing with a duplicate key error. |
| `sessions` | Linked to both `batch_id` and `trainer_id`. The `GET /sessions/active` endpoint uses a 4-table join to return only sessions for batches a student is enrolled in. |

---

## 5. Stack Choices

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript | Vite's fast HMR and React's component model made iteration very quick. TypeScript caught type mismatches (unused variables, wrong prop shapes) before they became runtime bugs. |
| **Styling** | Vanilla CSS (glassmorphism design system) | No Tailwind or component library. A single `global.css` with CSS custom properties keeps the bundle small and gives full control over the premium dark-mode aesthetic. |
| **Backend** | Node.js + Express 5 + TypeScript | Express 5 has native async error propagation. TypeScript + `tsx` for zero-compile-step development. Familiar, well-documented, fast to ship. |
| **Auth** | Clerk (React SDK + Node SDK) | Handles the entire auth UI (sign-up, sign-in, session management) so I could focus on the role-based business logic. The backend uses `ClerkExpressRequireAuth()` for cryptographic JWT signature verification on every protected route — not just payload decoding. |
| **Database** | Neon PostgreSQL + `node-postgres` (`pg`) | Serverless PostgreSQL with connection pooling built in. Used raw SQL (no ORM) to demonstrate query authorship and keep the dependency tree small. |
| **Deployment** | Vercel (frontend) + Railway (backend) | Both have free tiers and deploy from the same repository without config files. |

---

## 6. What Is Working, Partial, and Skipped

### ✅ Fully Working
- **Authentication**: Clerk sign-up, sign-in, and sign-out for all 5 roles
- **Role-Based Onboarding**: Role selector on first login; Trainer sees institution dropdown populated from DB
- **Backend RBAC**: Every API route is protected by `requireAuth` + `requireRole`. A Student calling a Trainer endpoint gets `403 Forbidden`. This is enforced server-side, not just in the UI.
- **Student dashboard**: Join batch via invite token, view active sessions, mark attendance (present / late)
- **Trainer dashboard**: Create batch, generate invite link, create session, view attendance by session — all using smart dropdowns populated from live DB data (no manual ID entry)
- **Institution dashboard**: View all batches and trainers associated with the logged-in institution
- **Programme Manager dashboard**: Global summary across all institutions + drill-down details per institution
- **Monitoring Officer dashboard**: Read-only view of programme-wide attendance rates with visual progress bars; no action buttons present anywhere in the UI
- **Database integrity**: `ON CONFLICT DO UPDATE` for attendance re-marking; `ON CONFLICT DO NOTHING` for batch join idempotency; `UNIQUE` and `CHECK` constraints enforced at DB level

### ⚠️ Partially Done
- **Invite tokens**: Currently a Base64-encoded batch ID (`btoa('batch_' + id)`). This is functional — students can join batches — but it is not cryptographically secure. A production system would use a signed JWT or a stored random token with an expiry date and single-use flag.
- **`absent` status**: The attendance schema supports it (`CHECK (status IN ('present', 'absent', 'late'))`), but the Student UI only exposes "Present" and "Late" buttons. Absent is implied when no mark is made, which is the simpler interpretation for an MVP.

### ❌ Skipped
- **Frontend toast notifications**: Errors and successes use `alert()` or inline text. A proper notification system (React Hot Toast etc.) was deprioritised in favour of getting all five role flows working correctly.
- **Session expiry gating**: The `GET /sessions/active` endpoint returns all sessions for a student's enrolled batches sorted by date — it does not check whether the current time falls within `start_time`–`end_time`. In a production system, attendance marking would be time-locked.
- **Admin batch assignment**: Institutions cannot currently assign existing trainers to specific batches through the UI — trainers self-create batches and are automatically associated. This covers the assignment's scope but would need a management UI for real use.

---

## 7. What I'd Do Differently With More Time

**Replace Base64 invite tokens with server-issued, expiring signed tokens.**

The current token is `btoa('batch_' + id)`, which anyone can construct if they know a batch ID. In production, `POST /batches/:id/invite` would `INSERT` a row into an `invite_tokens` table with a `uuid`, `batch_id`, `expires_at`, and `used` flag. The token in the URL would be the UUID — opaque and unguessable. On join, the backend would check it exists, is unexpired, and mark it used. This is a single afternoon of work that would make the system genuinely secure end-to-end.

---

## Folder Structure

```
/submission
├── CONTACT.txt
├── README.md
├── /backend
│   ├── src/
│   │   ├── server.ts          # Express app entry point
│   │   ├── db/index.ts        # PostgreSQL pool (Neon + SSL)
│   │   ├── middleware/auth.ts # Clerk JWT verification + role check
│   │   └── routes/
│   │       ├── users.ts       # Onboarding + /me
│   │       ├── batches.ts     # Batch CRUD + invite + join
│   │       ├── sessions.ts    # Session CRUD + attendance view
│   │       ├── attendance.ts  # Attendance marking
│   │       └── summary.ts     # Institution / Programme / Trainer summaries
│   ├── schema.sql             # Full DB schema (run once to initialise)
│   └── package.json
└── /frontend
    ├── src/
    │   ├── App.tsx            # Routing (public + protected)
    │   ├── main.tsx           # ClerkProvider setup
    │   ├── api.ts             # fetchWithToken helper
    │   └── pages/
    │       ├── Landing.tsx
    │       ├── Onboarding.tsx
    │       ├── Dashboard.tsx              # Role router
    │       ├── StudentDashboard.tsx
    │       ├── TrainerDashboard.tsx
    │       ├── InstitutionDashboard.tsx
    │       ├── ProgrammeManagerDashboard.tsx
    │       └── MonitoringOfficerDashboard.tsx
    └── package.json
```
