# Quality Report

Internal tracker for defective/damaged goods delivered to customers — Belden Brick and
Supply. Replaces a single-file HTML prototype (IndexedDB storage, a hardcoded client-side
"manager PIN", and manual `mailto:` notifications) with a real shared app: server-side
auth, a shared database, an append-only audit trail, and automatic email notification
with a PDF attached.

A quality complaint moves through three stages — **Submitted → Reviewed → Resolved** —
and carries three separate notes fields (one per stage) so context accumulates instead of
overwriting earlier notes.

- **Submitters** (yard staff, drivers, sales) file an intake report with photos. They can
  see only their own reports afterward, and can't edit them once submitted.
- **Managers** see a Kanban board of every report, can edit any field, move reports
  between stages, and add notes at each stage.

## Tech stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS, Prisma 7 + Postgres, cookie-based
sessions (JWT via `jose`, bcrypt password hashes), Server Actions for mutations,
S3-compatible object storage for photos, Resend for transactional email, `@react-pdf/renderer`
for PDF generation.

## Getting started

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL, SESSION_SECRET, etc.
npm run db:deploy       # applies the checked-in migration to your Postgres database
npm run db:seed         # creates the manager account + report-number counter
npm run dev
```

(`db:deploy` runs `prisma migrate deploy` — applies the existing migration in
`prisma/migrations/` as-is, no shadow database required. Once you're iterating on the
schema yourself, use `npm run db:migrate` — `prisma migrate dev` — instead, which needs a
reachable Postgres to diff against.)

The initial migration and Prisma Client were generated and type-checked in a sandboxed
build environment with no route to a live Postgres instance, so schema/migration
correctness is verified by `prisma migrate diff`'s SQL output and `tsc`/`next build`, not
by an actual `migrate deploy` run — run it once against your real database and skim the
output before relying on it in production.

Sign in at `/login` with the seeded manager credentials (`MANAGER_EMAIL` /
`MANAGER_PASSWORD` in `.env`, default `marcs@beldenae.com` / `ChangeMe123!` — change this
after first login). Managers land on `/board`; everyone else lands on `/report/new`.

New submitter/manager accounts are created from `/users` (manager-only) — there's no
self-registration, since this is an internal-only tool. Account creation generates a
one-time temporary password; a proper "force password change on first login" flow and a
self-service "change my password" page are the natural next additions (see Known
limitations).

### Scripts

| Script              | Purpose                                                    |
| -------------------- | ----------------------------------------------------------- |
| `npm run dev`        | Start the dev server                                        |
| `npm run build`      | `prisma generate` + production build                        |
| `npm start`          | Start the production server (after `build`)                 |
| `npm run db:migrate` | Apply Prisma migrations                                     |
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

## Architecture notes

- **Auth**: email/password today (`src/lib/auth-actions.ts`, `src/lib/session.ts`), with
  bcrypt-hashed passwords and signed JWT session cookies. `src/lib/dal.ts`'s
  `verifySession`/`requireManager` re-check the user's role against the database on every
  call (not just the cookie's claim), so a role change takes effect immediately rather
  than waiting out the session's 7-day expiry. `src/proxy.ts` (Next 16's renamed
  Middleware) does a cheap redirect based on the cookie for UX; the DAL is what actually
  enforces authorization on every request. Microsoft Entra ID SSO is the planned next
  step — swap `auth-actions.ts`/`session.ts` for an OIDC flow against Entra ID and keep
  the same `SessionPayload` shape so the rest of the app is unaffected.
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

- **Auth**: simple email/password now; Entra ID/M365 SSO was the brief's stated
  preference and is the natural next step once tenant/app-registration details are
  available (see Architecture notes above for the swap point).
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
