# WeVoro — QA Handoff

Everything a fresh session needs to QA-test this platform. Written 2026-09-07.

---

## 1. Where things run

| | URL |
|---|---|
| Frontend (QA) | https://qa.wevoro.com |
| Backend API (QA) | https://test-api.wevoro.com/api/v1 |
| Branch | `qa-may` (both repos) |
| Repos | `wevoro/wevoro-backend`, `wevoro/wevoro-frontend` |

Local dev: frontend `localhost:3003`, backend `localhost:4000`
(start backend with `bun --watch src/server.ts` from `wevoro-backend/`)

---

## 2. Test accounts

**`admin1234` is a master password** — it works for any account that has a password
(see `auth.service.ts`: `if (isUserExist.password && password !== 'admin1234')`).

### Caregivers — log in at `/pro/login`

| Email | Name | Role |
|---|---|---|
| wevoro.cna.grace@gmail.com | Grace Holloway | CNA |
| wevoro.cna.marcus@gmail.com | Marcus Bennett | PCA |
| wevoro.care.dana@gmail.com | Dana Whitfield | CNA |
| wevoro.care.elias@gmail.com | Elias Carter | PCA |
| wevoro.care.nadia@gmail.com | Nadia Okafor | CNA |
| wevoro.care.tobias@gmail.com | Tobias Lindgren | PCA |

All use password `admin1234`. Grace, Dana and Nadia are CNA; Marcus, Elias and Tobias are PCA.
**Role matters**: a caregiver only ever receives the signing documents for their own role.

### Other roles

| Role | Account | How to log in |
|---|---|---|
| Admin | riad@gmail.com / `admin1234` | `/admin/login` |
| Caregiver (main) | riadhossinr4@gmail.com / `admin1234` | `/pro/login` |
| Agency | riadhossinr4+agency@gmail.com | `/partner/access?mode=signin` — **passwordless**, emailed 6-digit code |

Agencies cannot use a password at all — `requestLoginCode` forces partners onto the
email-code flow even if they still carry a legacy password.

**To create a testable agency you control**, sign one up with a password instead — it
will not be flagged passwordless, so password login works:
`POST /user/signup {email, password, role:'partner'}` then
`POST /auth/login {email, password, source:'partner'}`.

---

## 3. Deploying to QA — read this before any deploy

**The backend deploys `dist/`, not `src/`.** `vercel.json` builds `dist/server.js`, and
`dist/` is committed to the repo. Editing TypeScript changes nothing in production until
you compile. This has already caused one silent no-op deploy where an entire service file
was missing from QA.

```bash
# BACKEND — the build step is not optional
cd wevoro-backend
npx tsc                 # regenerates dist/
git add -A && git commit -m "..."
git push origin qa-may
vercel --yes            # note the deployment URL it prints
vercel alias set <that-url> test-api.wevoro.com

# FRONTEND
cd wevoro-frontend
git push origin qa-may
vercel --yes
vercel alias set <that-url> qa.wevoro.com
```

Git auto-deploy is broken since the Vercel ownership transfer — deploys must be manual.

**How to prove a deploy actually took**: call an endpoint whose response shape changed.
Example: `POST /esign/documents` now returns a `caregiversNotified` field. If it is
missing, QA is running old code.

---

## 4. What is built and how to test it

### SCRUM-117 — Agency signing-document library
Agency → **Documents** tab (`/partner/documents`).
- Upload documents into the CNA and PCA groups (PDF/DOCX, max 10 MB, max 10 per group).
- Replace a document → caregivers still waiting get the new version, old one marked outdated.
- Documents are sent automatically when a caregiver connects.
- Uploading a new document now also reaches caregivers **already** onboarding.

### SCRUM-118 — Caregiver e-signature
Caregiver → **Offers → Received** → Accept → Step 1 (files) → Step 2 (sign).
- Step 2 requires scrolling to the end of each document before Submit unlocks.
- "Sign here" opens a modal where the caregiver **draws** their signature.
- The drawing is captured once and reused for every document in the packet.
- The signature is burned onto the last page of the PDF next to the WeVoro mark, and a
  Certificate of Completion page is appended (signer, time, IP, browser, SHA-256 of the original).
- When the last document is signed, all signed PDFs are zipped and emailed to the agency.
- **Signing without drawing is rejected** — server returns 400
  "Draw your signature before signing this document".

### SCRUM-108 — Credential expiry emails
Four templates: 60-day, 30-day, expired, rejected. Sent via Resend from `wevoro.com`.
Driven by a Vercel cron (`0 8 * * *`). Vercel Hobby rejects crons more than once a day.

### SCRUM-99 — Passwordless agency login
`/partner/access?mode=signin` → email → 6-digit code → dashboard.
An agency that already completed the profile form must **not** be sent back to it.

---

## 5. Open bugs — not yet fixed

These are confirmed by reading the code, not guesses.

**1. Step 1 submission is broken on the newer modal** (`apply-to-shift-modal.tsx`)
Three stacked defects, all confirmed:
- Files are appended as `` `file_${req.title}` `` but the backend looks them up by
  document ObjectId (`fileMap[doc._id.toString()]`) — the file uploads to the CDN and binds
  to nothing.
- The proxy `app/api/user/offer/pro-respond/route.ts` forwards only `File` entries and a
  field named `statusUpdates`. The modal sends `docActions` — dropped. The backend has no
  `docActions` handler at all.
- Both proxy error paths return HTTP **200** with `status: 500` in the body, and the modal
  checks `data.status === 200 || res.ok` — so failures show "Application submitted!".

The older `pro-request-modal.tsx` does all three correctly, which is why the bug looks
intermittent: it depends which screen the caregiver used.

**2. "Use a different email" does nothing** (`app/(auth)/partner/access/page.tsx`)
The handler and state logic are correct, and the native click event fires and propagates
fully — but React's `onClick` never runs (0/6 on QA, reproduces locally). It is the only
`onClick` on that page; everything else is `onSubmit`/`onChange`. Unresolved.

**3. Caregiver offer card sometimes shows no documents**
Nadia's packet had 4 items server-side, but her offers page made **zero**
`/api/esign/offer/` calls. The fetch in `received-card.tsx` is gated on offer status
(`received` or `pending`) — outside those, the signing section is never fetched.

**4. Old completed packets keep a stale signer name**
`stampName` is now resolved at signing time, but `signItem` throws for completed packets,
so three already-finished packets keep `emoncr55@gmail.com emoncr55@gmail.com`. Their PDFs
on the CDN also have no drawn signature. Needs a backfill if it matters.

**5. Removing a signing document does not retract it** from packets already issued.
Adding works; removing was left alone deliberately — "what happens to a packet whose last
unsigned document is withdrawn" is a product decision.

**6. `/api/proxy-download` is an unauthenticated open fetch proxy** with no URL allowlist.
It is the transport for the legacy Download All. It would bypass any paywall, and it is an
SSRF surface independent of that.

---

## 6. Monetization (SCRUM-113 / 115 / 119) — designs ready, not built

**Blocked**: there is no Stripe anywhere — no package, no keys, no references.
Needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
Webhook endpoint to register: `https://test-api.wevoro.com/api/v1/payment/webhook`
(events `payment_intent.succeeded`, `payment_intent.payment_failed`).

**Second blocker, in our code**: `src/app.ts` mounts `express.json({limit:'50mb'})` globally
before routes. A Stripe webhook needs the **raw** body to verify signatures, so `app.ts`
must gain a route-scoped raw parser above that line. That file is shared by every route —
change it carefully and smoke-test everything after.

Approved designs are downloaded to `figma-refs/` (not committed):
`scrum113.png`, `offer-card-locked.png`, `docs-locked.png`, `docs-unlocked.png`,
`gate-payment.png`, `gate-success.png`, `gate-delivery-failed.png`, `scrum119.png`.
Figma file key `a2PjlZwy00TTdGFLpC59VX`; SCRUM-113 node `10554-3948`, SCRUM-119 node `10631-3948`.

---

## 7. Traps that have already cost time

- **`req.user.userId` is undefined.** The JWT carries `_id`. Use the `currentUserId(req)`
  helper in `esign.controller.ts`.
- **`auth()` reads the raw Authorization header** — it does not strip `Bearer `. Send the
  bare token.
- **SUPER_ADMIN bypasses the role check**, so `auth(ADMIN)` already admits super_admin.
- **Multipart endpoints take one field called `data` holding JSON**, not separate fields.
  `updateOrCreateUserPersonalInformation` does `JSON.parse(req.body.data || '{}')` — send
  the wrong shape and it returns 200 having saved nothing.
- **The frontend proxies drop fields.** Three separate bugs so far were a route in
  `app/api/**` rebuilding the body field-by-field and silently losing one. Check this first
  whenever a feature "does nothing".
- **`config.frontend_url` points at `qa.joinhirenza.com`** — a different product. Use
  `APP_PUBLIC_URL` / `emailAppUrl()` for anything customer-facing.
- **New notification types must be added** to the `type` enum in `user/notification.model.ts`
  or `Notification.create()` throws.
- **The local `.env` DATABASE_URL is not the QA database.** QA has its own, and
  `vercel env pull` redacts it.
