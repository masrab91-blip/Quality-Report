# Quality Report

Internal tracker for defective/damaged goods delivered to customers — Belden Brick and
Supply. Replaces a single-file HTML prototype (IndexedDB storage, a hardcoded client-side
"manager PIN", and manual `mailto:` notifications) with a real shared app: server-side
auth, a shared database, an append-only audit trail, and automatic email notification
with a PDF attached.

A quality complaint moves through three stages — **Submitted → Reviewed → Resolved** —
and carries three separate notes fields (one per stage) so context accumulates instead of
overwriting earlier notes.

- **Anyone** (yard staff, drivers, sales) can file an intake report with photos at
  `/report/new` — no account, no login. They type their own name on the form, which is
  what shows up as "reported by" everywhere.
- **Managers** sign in at `/login` to see a Kanban board of every report, edit any field,
  move reports between stages, and add notes at each stage. Manager accounts are created
  from `/users` by an existing manager.

## Tech stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS, Prisma 7 + Postgres, cookie-based
sessions (JWT via `jose`, bcrypt password hashes), Server Actions for mutations,
S3-compatible object storage for photos, Resend for transactional email, `@react-pdf/renderer`
for PDF generation.

## Quickstart (local, no accounts needed)

Requires [Node.js](https://nodejs.org) 20+ and [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(just needs to be running — you don't need to know Docker, the setup script drives it).

```bash
npm install
npm run setup   # creates .env, starts a local Postgres in Docker, applies migrations, seeds Marc's account
npm run dev
```

Open `http://localhost:3000/login` and sign in as `marcs@beldenae.com` / `ChangeMe123!`
(change this after first login). That's the whole setup — `npm run setup` is safe to
re-run any time.

Everything above runs against a throwaway local database. Email sending and photo
storage are both optional and no-op gracefully when unconfigured, so you can try the
whole submit → board → resolve flow before touching either. See **Deploying to
production** below when you're ready to put this somewhere real people can reach it.

### Manual setup (using your own database instead of Docker)

If you already have a Postgres instance (e.g. [Prisma Postgres](https://console.prisma.io),
Neon, Supabase) and don't want the local Docker one:

```bash
npm install
cp .env.example .env    # set DATABASE_URL to your own connection string, and SESSION_SECRET
npm run db:deploy       # applies the checked-in migration — no shadow database required
npm run db:seed         # creates the manager account + report-number counter
npm run dev
```

`npm run setup` detects a `DATABASE_URL` you've already set to something other than the
local Docker default and skips starting Docker, running the same migrate+seed steps
against your database instead — so it's fine to run either way.

New manager accounts are created from `/users` (manager-only) — there's no
self-registration for managers, and no account at all needed to submit a report. Account
creation generates a one-time temporary password; a proper "force password change on
first login" flow and a self-service "change my password" page are the natural next
additions (see Known limitations).

### Scripts

| Script              | Purpose                                                    |
| -------------------- | ----------------------------------------------------------- |
| `npm run setup`      | One-command local setup (see Quickstart above)              |
| `npm run dev`        | Start the dev server                                        |
| `npm run build`      | `prisma generate` + production build                        |
| `npm start`          | Start the production server (after `build`)                 |
| `npm run db:deploy`  | Apply the checked-in migration to a fresh database          |
| `npm run db:migrate` | Create a new migration from schema changes (needs a reachable Postgres) |
| `npm run db:seed`    | Seed the manager account + report-number counter            |
| `npm run db:studio`  | Open Prisma Studio to browse the database                   |
| `npm run db:reset`   | Drop and recreate the database, then reseed                 |

## Configuration (`.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | Signs session cookies — generate with `openssl rand -base64 32` |
| `MANAGER_EMAIL` / `MANAGER_PASSWORD` / `MANAGER_NAME` | seed only | First manager account |
| `RESEND_API_KEY` / `EMAIL_FROM` | for email | Enables the automatic submission-notification email (PDF attached). Without it, submissions still work — the email is just skipped. |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_ENDPOINT` | for photos | S3-compatible object storage (AWS S3, Cloudflare R2, MinIO). Leave `S3_ENDPOINT` unset for real AWS S3. Without these set, photo upload is disabled but the rest of the app works — matches the pattern used for email. |

## Deploying to production

The straightforward path is **Vercel + a managed Postgres**, since Vercel's free tier
handles Next.js with zero config and its Storage tab can provision a database for you.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Don't deploy yet —
   add the database first (next step), or the first deploy will just fail on a missing
   `DATABASE_URL`.
3. In the new project, go to **Storage → Create Database** and add a Postgres database
   (Prisma Postgres or Neon both work through Vercel's marketplace). This automatically
   sets `DATABASE_URL` in the project's environment variables.
4. Go to **Settings → Environment Variables** and add the rest: `SESSION_SECRET` (a
   random string — `openssl rand -base64 32`), `MANAGER_EMAIL`/`MANAGER_PASSWORD`, and
   optionally the `RESEND_*`/`S3_*` ones once you have those accounts set up.
5. Deploy (Vercel does this automatically once the repo is imported, or click **Deploy**).
6. Run the migration and seed **once**, from your own machine, against the production
   database:
   ```bash
   npx vercel env pull .env.production.local   # pulls the real DATABASE_URL etc. down locally
   npx dotenv -e .env.production.local -- npx prisma migrate deploy
   npx dotenv -e .env.production.local -- npx prisma db seed
   ```
   (`npx vercel` will prompt you to log in and link the project the first time.)
7. Visit the URL Vercel gives you and sign in as the manager account from step 4.

From then on, every `git push` to the branch Vercel is watching redeploys automatically.
You only need to repeat step 6 when the schema changes (i.e. new migrations show up in
`prisma/migrations/`).

## Architecture notes

- **Auth**: report submission (`/report/new`, `/report/[id]`, the photo presign route)
  requires no account at all — the submitter just types their own name, captured in
  `Report.reportedBy` and echoed into the audit log's `actorName` field. Only the manager
  board (`/board`, `/dashboard`, `/users`) is gated, via email/password
  (`src/lib/auth-actions.ts`, `src/lib/session.ts`) with bcrypt-hashed passwords and
  signed JWT session cookies. `src/lib/dal.ts`'s `requireManager` re-checks the user's
  role against the database on every call (not just the cookie's claim), so a role change
  takes effect immediately rather than waiting out the session's 7-day expiry.
  `src/proxy.ts` (Next 16's renamed Middleware) does a cheap redirect based on the cookie
  for UX; the DAL is what actually enforces authorization on every request. Microsoft
  Entra ID SSO remains a future option for the manager side — swap
  `auth-actions.ts`/`session.ts` for an OIDC flow against Entra ID and keep the same
  `SessionPayload` shape so the rest of the app is unaffected.
- **Audit log** (`src/lib/audit.ts`, `AuditLog` model): append-only by convention —
  nothing in the codebase updates or deletes a row. Every report creation, field edit,
  stage change, and note addition writes an entry inside the same transaction as the
  change it records.
- **Report numbers** (`src/lib/report-number.ts`): a `Counter` row incremented via a
  single atomic `UPDATE ... SET value = value + 1`, always inside the same transaction as
  the `Report` row's creation — a crashed submission never burns a number, and concurrent
  submissions never collide.
- **Photo upload** (`src/lib/storage.ts`, `src/components/photo-uploader.tsx`): the
  browser uploads directly to S3-compatible storage via a presigned PUT URL obtained from
  `/api/photos/presign`, rather than routing binary data through a Server Action or Route
  Handler — that keeps large photo uploads clear of the small request-body limits
  serverless hosts (e.g. Vercel) impose on app functions. Only the resulting object keys
  travel through the report-creation Server Action.
- **PDF generation** (`src/lib/pdf.tsx`): rendered server-side with
  `@react-pdf/renderer`, embedding photo bytes fetched from object storage. Generated once
  automatically on submission (for the notification email) and on demand at
  `/api/reports/[id]/pdf`.
- **Email** (`src/lib/email.ts`): sent server-side via Resend on submission, PDF attached
  — no `mailto:`, no manual click, no dependency on someone happening to see the link.
- **Notes**: `notesSubmitted` / `notesReviewed` / `notesResolved` are separate text
  columns; adding a note appends a timestamped, attributed entry rather than overwriting
  the field, so earlier context is never lost.

## Known limitations / next steps

- **Auth**: report submission is intentionally open to anyone with the link — there's no
  identity verification on who typed a given name, and no rate limiting on submission or
  photo upload. Fine for an internal tool on an unlisted URL; revisit if this ever needs
  to resist abuse. Manager login is simple email/password today; Entra ID/M365 SSO was
  the brief's original preference and is a natural next step for the manager side (see
  Architecture notes above for the swap point).
- **Password lifecycle**: `/users` generates a temporary password on account creation but
  there's no forced-change-on-first-login flow or self-service password change yet.
- **Retention**: reports and photos are kept indefinitely (quality complaints can become
  evidence in vendor claims/customer disputes) — there's no automatic expiry job. If a
  retention policy is set later, it'd be a scheduled job pruning `Photo` rows/objects and
  closed `Report` rows past some age.
- **CSV export** matches the Excel tracking log's field set, but the exact column order
  wasn't independently verifiable against `Quality_Issue_Tracking_Log.xlsx` in this repo
  (the file isn't present here) — sanity-check ordering against the live spreadsheet
  before treating the export as a drop-in replacement.

The submit → board → move stage → add note → audit log → dashboard → CSV export flow has
been run end-to-end against a real Postgres database and checked in a browser. Email
sending and photo upload haven't been — both need real accounts (Resend, an S3-compatible
bucket) that weren't available while building this.
