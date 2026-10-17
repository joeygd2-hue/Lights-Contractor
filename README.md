# Sugar Land Lighting Solutions — website

Marketing site, quote requests, consultation booking and an owner dashboard for a
residential Christmas-light installation company in New Territory, Sugar Land, TX.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 ·
PostgreSQL + Drizzle ORM · Resend (email, optional) · Vitest + Playwright.

---

## Launch checklist

Everything below is a placeholder or a default that needs your confirmation before going live.
Business details live in **`src/config/site.ts`**; secrets go in environment variables.

| What | Where | Status |
| --- | --- | --- |
| Phone number (`phone`, `phoneHref`) | `src/config/site.ts` | `null` — hidden until set |
| Public email (`email`) | `src/config/site.ts` | `null` — hidden until set |
| Logo (`logo`) | `src/config/site.ts` + `/public/brand/` | `null` — typeset wordmark used |
| Domain | `NEXT_PUBLIC_SITE_URL` env var | must be set |
| Business hours (`hours`) | `src/config/site.ts` | `null` — hidden |
| Reply-time promise (`responseTime`) | `src/config/site.ts` | `null` — no promise shown |
| Social links | `src/config/site.ts` → `social` | all `null` |
| Service-area ZIPs | `src/config/site.ts` → `serviceAreas` | New Territory = `77498` — **verify** |
| Price range line ("$800 to $2,000") | `src/config/site.ts` → `pricing.showRange` | **off** — flip to `true` once confirmed |
| Install / takedown windows | `src/config/site.ts` → `season` | defaults — confirm |
| Consultation hours | `/admin/availability` | starter hours Mon–Fri 5–7:30 pm, Sat 9–3 — **set your real hours before launch** |
| Testimonials | `src/config/site.ts` → `testimonials` | empty — section hidden until you add real reviews |
| Project photos | `src/config/site.ts` → `photos` | all **stock** — replace as you complete installs |
| About-page story | `src/app/(site)/about/page.tsx` → `story` | draft — rewrite in your own words |
| FAQ answers | `src/content/faqs.ts` | review every answer matches how you operate |
| Commitments in copy | home page, FAQ, About | confirm you offer in-season fixes ("let us know and we'll come back"), clip-only install (no nails), LED lights, written proposals |
| Privacy policy & terms | `src/app/(site)/privacy`, `/terms` | plain-language drafts — have them reviewed |
| Admin login | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | must be set |
| Email delivery | `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_NOTIFICATION_EMAIL` | optional, strongly recommended |

### Photos

Every image in `/public/images/stock/` is a licensed Unsplash photo (Unsplash License) and is
marked `source: "stock"` in the config, which shows a small **"Representative photo"** label on
the site. They are not presented as your work. To add your own installs:

1. Put the file in `/public/images/projects/` (JPG, ~2000 px wide is plenty).
2. Add an entry to `photos` in `src/config/site.ts` with `source: "project"`, real `width`/`height`,
   descriptive `alt`, `categories`, and an optional `caption` (e.g. "New Territory · 2026").
3. Add its key to `galleryOrder` and/or point a service's `image` at it.

Credits for stock images are listed at `/photo-credits`.

---

## Local development

Requirements: Node.js 20.9+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env.local        # then fill in DATABASE_URL etc.
createdb lights                   # or create a database in your provider
npm run db:migrate                # applies everything in /drizzle
npm run admin:hash -- "a long unique password"   # paste output into ADMIN_PASSWORD_HASH
npm run dev                       # http://localhost:3000
```

The owner dashboard is at **`/admin`**.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm test` | Unit + database integration tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) against a production build |
| `npm run check` | typecheck + lint + tests + build |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run admin:hash -- "pw"` | Print an `ADMIN_PASSWORD_HASH` value |

### Tests

Integration and E2E tests write to a **separate** database (they truncate tables).

```bash
createdb lights_test
DATABASE_URL=postgres://…/lights_test npm run db:migrate
TEST_DATABASE_URL=postgres://…/lights_test npm test

npm run build
E2E_DATABASE_URL=postgres://…/lights_test \
E2E_ADMIN_PASSWORD_HASH="$(npm run -s admin:hash -- e2e-owner-password)" \
npm run test:e2e
```

What's covered:

- **Unit** — form validation rules; slot generation (time zones/DST, minimum notice, booking
  window, blackout dates, buffers, overlapping rules).
- **Integration (real Postgres)** — lead persistence and normalization, idempotent
  resubmission, rate limiting, booking creation, rejection of invalid/taken slots, **12
  simultaneous requests for one slot → exactly one succeeds**, overlapping concurrent requests,
  cancellation freeing a slot, the database-level no-overlap constraint.
- **E2E (Chromium, desktop + Pixel 7)** — every page renders with metadata, every internal link
  resolves, navigation, gallery filter/lightbox/keyboard, ZIP checker, FAQ accordion, structured
  data, full quote flow through to the database, API validation/dedup/honeypot/rate limits,
  contact form, full booking flow, racing bookings (201 vs 409), blackout dates, admin
  authentication (including forged cookies), lead status/notes, CSV export, availability
  editing, cancellation, mobile overflow, mobile menu focus handling, touch-target sizes.

---

## How it works

### Quote requests — `/quote` → `POST /api/quote`
Five-step form with per-step validation (the same Zod schemas run on the server,
`src/lib/validation.ts`). On submit the lead is saved to `leads` with a reference like
`Q-7K3Q9M`. Each form session carries an idempotency key, so double-clicks and retries never
create duplicates. Owner notification and customer confirmation emails are sent after the
response (`after()`), and their outcome (`sent` / `skipped` / `failed`) is stored on the lead.
**A lead is never dropped because email failed.**

### Consultation booking — `/book` → `GET /api/availability`, `POST /api/bookings`
Availability is computed live from the database: weekly hours, appointment length, buffer, start
interval, minimum notice, booking window and blocked dates — all editable in
`/admin/availability`. The server re-validates the requested slot, and a PostgreSQL **exclusion
constraint** on `[start_at, blocked_until)` makes overlapping confirmed bookings impossible even
under simultaneous requests (`drizzle/0001_booking_exclusion.sql`). The loser of a race gets a
409 and the UI reloads times. There is no external calendar integration; appointments live in
the database and the dashboard.

### Contact form — `/contact` → `POST /api/contact`
Saved as a `contact` lead, same pipeline as quotes.

### Spam & abuse protection
Same-origin check, JSON size limit, per-IP rate limits stored in Postgres (IPs are salted-hashed,
never stored raw), a hidden honeypot field and a minimum fill time. Bot submissions get a
normal-looking response but nothing is saved.

### Owner dashboard — `/admin`
Single owner account (`ADMIN_EMAIL` + scrypt `ADMIN_PASSWORD_HASH`). Sessions are random tokens
stored hashed in `admin_sessions` (7-day expiry) in an `httpOnly`, `SameSite=Lax` cookie;
sign-in is rate limited. `src/proxy.ts` bounces requests without a cookie, and every admin page,
server action and the CSV export re-verify the session against the database.

- **Overview** — new leads, last 7 days, upcoming consultations, email-status warning
- **Leads** — search/filter, detail view, status (New → Contacted → Quote sent → Booked →
  Closed), internal notes, CSV export (formula-injection safe)
- **Consultations** — upcoming/past/cancelled, reschedule (conflict-checked), cancel, mark
  completed, optional customer emails
- **Availability** — weekly hours, booking rules, blocked dates

### Pricing
Quote-driven. `pricing.showRange` (off) shows the "Most homes range from $800 to $2,000" line on
Services, FAQ and the quote form. `pricing.startingAt` and `pricing.seasonalOffer` are there for
later; nothing is displayed until you fill them in.

### SEO
Per-page titles/descriptions/canonicals, Open Graph image, `sitemap.xml`, `robots.txt`
(blocks `/admin` and `/api`), `HomeAndConstructionBusiness` JSON-LD with only verified fields
(phone/email/logo appear automatically once set), `Service` and `FAQPage` structured data. No
thin neighborhood doorway pages — add a service-area page only when you have genuinely local
content for it.

---

## Email setup (Resend)

1. Create an account at [resend.com](https://resend.com) and add your domain.
2. Add the DNS records Resend gives you (SPF/DKIM) at your domain registrar and wait for
   "Verified".
3. Create an API key and set `RESEND_API_KEY`, `EMAIL_FROM` (e.g.
   `Sugar Land Lighting Solutions <hello@your-domain.com>`) and `OWNER_NOTIFICATION_EMAIL`.
4. Submit a test quote and check both inboxes; the lead's detail page in `/admin` shows whether
   each email was sent.

Until this is done, the site works normally but sends no email, and the dashboard says so.

---

## Deploying (Vercel + Neon — recommended)

1. **Database:** create a Postgres database (e.g. [Neon](https://neon.tech), free tier is fine).
   Copy the pooled connection string.
2. **Migrate:** `DATABASE_URL="<connection string>" npm run db:migrate`
3. **Vercel:** import the GitHub repo, framework "Next.js". Add the environment variables from
   `.env.example` (Production *and* Preview). Deploy.
4. **Domain:** Vercel → Project → Settings → Domains → add your domain and follow the DNS steps.
   Update `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com` and redeploy.
5. Sign in at `/admin`, set your real consultation hours, and block any days off.
6. Submit a test quote and a test booking, then delete/close them in the dashboard.

Any Node host works (Render, Railway, Fly, a VPS): `npm ci && npm run build && npm start`
with the same environment variables. Run `npm run db:migrate` whenever new migrations are added.

---

## Project structure

```
src/
  config/site.ts         ← business details, services, service area, pricing, photos
  config/nav.ts          ← navigation + CTA labels
  content/               ← FAQ and process copy
  app/(site)/            ← public pages
  app/admin/             ← owner dashboard (login, overview, leads, bookings, availability)
  app/api/               ← quote, contact, availability, bookings, admin export
  components/site/       ← header, footer, photo, gallery, etc.
  components/forms/      ← quote wizard, booking flow, contact form, field components
  lib/validation.ts      ← shared Zod schemas (client + server)
  lib/booking/           ← pure availability/slot logic
  lib/server/            ← DB-backed services: leads, bookings, auth, email, rate limit
  db/schema.ts           ← Drizzle schema
  proxy.ts               ← admin route gate
drizzle/                 ← SQL migrations
tests/                   ← unit, integration, e2e
```

## Not included (yet)

- **Photo uploads** in the quote form — customers are asked to reply to their confirmation email
  with photos instead (no file storage to secure or pay for). Can be added with S3/R2/Vercel Blob.
- **Address autocomplete** — plain address fields are used; no autocomplete provider is configured.
- **Google Calendar sync** — bookings live in the database/dashboard only.
- **Online payments / deposits** — not built.
- **Analytics** — none installed; if you add one, update the privacy policy.
