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
| Admin (founder) | `qa.admin@wevoro-test.com` / `admin1234` — it is a **super_admin**, so the login body needs `source: 'admin'`. (`riad@gmail.com` does NOT exist on QA.) | `/admin/login` |
| Caregiver (main) | riadhossinr4@gmail.com / `admin1234` | `/pro/login` |
| Agency | riadhossinr4+agency@gmail.com | `/partner/access?mode=signin` — **passwordless**, emailed 6-digit code |

**Agency login is passwordless.** `/partner/login` redirects to `/partner/access?mode=signin`,
which has an email field and no password field — you need the 6-digit code from that inbox.
So an agency whose mailbox you cannot read (e.g. `qa.agency.pay@wevoro-test.com` on the
fake `wevoro-test.com` domain) cannot be signed into via the browser at all. Use
`riadhossinr4+agency@gmail.com`, whose code lands in Riad's Gmail.

Agencies cannot use a password at all — `requestLoginCode` forces partners onto the
email-code flow even if they still carry a legacy password.

**To create a testable agency you control**, sign one up with a password instead — it
will not be flagged passwordless, so password login works:
`POST /user/signup {email, password, role:'partner'}` then
`POST /auth/login {email, password, source:'partner'}`.

**The agency UI is passwordless, but the API is not.** `riadhossinr4+agency@gmail.com`
logs in fine over the API with the master password:
`POST /auth/login {email, password:'admin1234', source:'partner'}`. To drive an agency
session in a browser without an email code, take that `accessToken` and set it as the
`accessToken` cookie on `qa.wevoro.com` (plus `refreshToken`) — the frontend reads auth
from those cookies, so the session is live with no OTP. Verified 2026-09-07.

**Getting a user id**: the login response does not contain one. Decode the JWT payload —
the id is in `_id`.

---

## 3. Deploying to QA — read this before any deploy

> ### ⚠️ `vercel --yes` DEPLOYS TO THE WRONG DATABASE
>
> Discovered the hard way on 2026-09-07. On the backend, **Preview and Production have
> different `DATABASE_URL` values, pointing at different databases**:
>
> | Vercel environment | DATABASE_URL set | Which data |
> |---|---|---|
> | **Production** | 89d ago | **the QA data everyone uses** — the six test caregivers, the packets, the agency library |
> | Preview | 29d ago | a different, older database — no test caregivers at all |
>
> `vercel --yes` builds a **Preview** deployment. Aliasing that to `test-api.wevoro.com`
> silently swaps the whole QA database: every test caregiver vanishes, agency document
> libraries show stale contents, and logins fail with "User does not exist". Nothing is
> destroyed — the data is still in the other database — but QA looks catastrophically
> broken until the alias is put back.
>
> **Recovery**: `vercel ls`, find the most recent deployment whose Environment column says
> **Production**, and alias `test-api.wevoro.com` back to it.
>
> The frontend does *not* have this split — its Preview env has the right API URL, so a
> Preview frontend deploy works fine.



**The backend deploys `dist/`, not `src/`.** `vercel.json` builds `dist/server.js`, and
`dist/` is committed to the repo. Editing TypeScript changes nothing in production until
you compile. This has already caused one silent no-op deploy where an entire service file
was missing from QA.

> ### ⚠️ NEVER run plain `vercel --yes` on the backend
>
> It builds a **Preview** deployment **and Vercel moves `test-api.wevoro.com` onto it by
> itself** — you do not have to alias anything for QA to break. Preview points at a
> different database, so within seconds every login answers `"User does not exist"` and QA
> looks wiped. This happened on 2026-09-09 *after* deciding not to alias the Preview build,
> which is exactly why "I just won't alias it" is not protection.
>
> Use `vercel --prod` on the backend. Always.

```bash
# BACKEND — the build step is not optional
cd wevoro-backend
npx tsc                 # regenerates dist/
git add -A && git commit -m "..."
git push origin qa-may
vercel --prod --yes     # Production. NOT plain `vercel --yes`.
# Confirm before going further:
vercel ls               # the new deployment must say Environment = Production

# FRONTEND — no Preview/Production database split here, so --yes is safe
cd wevoro-frontend
git push origin qa-may
vercel --yes
vercel alias set <that-url> qa.wevoro.com
```

**If QA logins start failing with "User does not exist"**, the backend domain is on a
Preview deployment. Recover with:

```bash
vercel ls                                     # find the newest Environment = Production
vercel alias set <that-production-url> test-api.wevoro.com
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

---

## 8. Evidence captured 2026-09-07 (for the client invoice)

`WEVORO-INVOICE-SEP2026.html` in the repo root is the client-facing invoice for the eight
delivered tickets ($2,700). Its screenshots are in `qa-shots/invoice/` and were all taken
from live QA that day, not from Figma.

While capturing them, a full e-signature run was performed end to end on QA:
agency `agecny 2` had two PCA documents uploaded through the UI, Marcus Bennett was
connected via `GET /document/download-package/:caregiverUserId`, and he signed
*PCA Service Agreement* in the browser with a genuinely drawn signature. The resulting PDF
(`qa-shots/invoice/118-signed-pdf-p1.png` / `-p2.png`) carries the drawing plus a
Certificate of Completion with signature ID `WV-SIG-2026-78C757` and a SHA-256 hash.
**That packet still has one unsigned document** (*Confidentiality Agreement*) — the second
document's Submit stays disabled until its viewer is scrolled to the end, which the
automation could not drive.

Missing evidence: **SCRUM-109** (admin credential confirmation, nine rejection reasons) has
no screenshot, because there is no working admin account on QA. **SCRUM-110** is evidenced
by a credential still under review, so its expiry countdown shows dashes rather than a live
figure — a caregiver with an approved, dated credential would show it properly.

---

## 9. Fixes committed 2026-09-07 (pushed, NOT yet deployed)

Four defects found by an audit were verified in the code and fixed. Both repos are
committed and pushed to `qa-may`; **neither has been deployed** — the `vercel` call failed
with a network error and the retry was blocked. Run the deploy from section 3 to ship them.

- backend `3577613` — SCRUM-117/118
- frontend `70402f2` — SCRUM-205/118

**1. A document could be marked signed with no signed file.** `signItem` set
`item.status = 'signed'` and *then* stamped inside a try/catch that only logged. Any
stamping failure left a document recorded as signed with no artefact — and `buildPackage`
silently omits items with no `signedFileUrl`, so the agency got a completion ZIP quietly
missing a document it was told had been signed. Now stamps first and records second; a
failure returns 500 and persists nothing.

**2. Word files were accepted but could never be signed.** `ALLOWED_MIME` took
`.doc`/`.docx`, but the stamper is pdf-lib, which throws on anything that is not a PDF —
so every Word document hit defect 1. Signing documents are **PDF-only** now, refused at
upload, backend and both frontend modals. If the client wants Word back it needs a
DOCX→PDF conversion step on upload — that is new work, not a bug fix.

**3. Pairs that connected before the offer code shipped were stranded for ever.**
`ensureOfferOnConnection` ran only inside `if (priorDownloads === 0)`. Any agency/caregiver
pair with existing audit rows was therefore excluded permanently: the agency kept seeing
"sent automatically on connection" while the caregiver was never asked to sign anything.
The call now runs on every download — it is idempotent, returning early when an offer
already exists. **Stranded pairs recover on their agency's next download**, so this needs a
download per affected pair, not a migration. Likely affected on QA: the agency `mn`, which
has downloaded all six test caregivers; Elias and Tobias still show 0 packets.

**4. Mobile Sign Out was missing on public caregiver profiles.** The mobile sheet gated on
`!isPublicProPage` while the desktop bar gated on `!isPublicProPage || user?.role`.
Both now use the same condition. **Note:** an earlier audit reported this on
`/partner/pros/[id]` — that is wrong. `isPublicProPage` is
`pathName.includes('pro/') && id`, and `/partner/pros/<id>` contains no `pro/` substring.
The genuinely affected routes are **`/pro/[id]`** and **`/pro/partner/[id]`**.

### Not fixed — needs a decision

**SCRUM-110 PCA grouping is cosmetic.** `credential-status-section.tsx` renders
`card('Written Exam (GACCP)')` and `card('RN / LPN sign-off')` from the *same* `cred`
object, so the two PCA rows are two labels on one document. The backend returns a single
`certifications` entry. Making PCA genuinely two documents is a data-model change
(schema, upload, admin review, expiry) — size it as a ticket, do not patch the view.
