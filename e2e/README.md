# WeVoro end-to-end tests

Automated browser tests that drive the real site the way a caregiver, an agency
and the WeVoro team do. They run against a deployed environment (QA by
default), in a real Chrome, so they check the app as it is actually served.

Tool: [Playwright](https://playwright.dev).

## Run it

From the `wevoro-frontend` folder:

```bash
npm install            # first time only
npm run test:e2e       # fast: no window, pass/fail count in the terminal
```

To watch it happen in a browser window:

```bash
npm run test:e2e:live  # opens Chrome and plays through every step
```

Other commands:

| Command | What it does |
|---|---|
| `npm run test:e2e` | Runs everything headless and prints each test with a tick or a cross, then the totals. |
| `npm run test:e2e:live` | Same run, with the browser visible. Slower, good for showing the flow. |
| `npm run test:e2e:ui` | Playwright's own runner: pick tests, step through them, inspect each action. |
| `npm run test:e2e:report` | Opens the HTML report of the last run, with the screenshots. |

Run one file only:

```bash
npx playwright test e2e/00-full-workflow.spec.ts
```

## What it covers

`00-full-workflow.spec.ts` is the whole journey in one run, in the order it
really happens. Each step is named, so the terminal reads like the journey and
every step leaves a screenshot in the report.

| Step | What it proves |
|---|---|
| 1 | A caregiver signs in on the real login page. |
| 2 | The caregiver adds a credential and it appears on the profile. |
| 3 | The share link shows a public preview and hands out no files. |
| 4 | An agency opening the link lands on that caregiver's profile. |
| 5 | The caregiver shows in Offers › Submitted (SCRUM-122). |
| 6 | Credentials stay locked until the agency pays (SCRUM-123). |
| 7 | Paying opens Stripe checkout with no internal error on screen (SCRUM-124). |
| 8 | A packet the agency has bought opens the credential file itself. |

The other files check one area each on its own, so a failure points straight at
it:

| File | Area |
|---|---|
| `01-login.spec.ts` | Caregiver login, and a wrong password being refused. |
| `02-credential-upload.spec.ts` | A caregiver uploading a document. |
| `03-credential-view.spec.ts` | View Credential, bought and not bought. |
| `04-share-link.spec.ts` | Share link into Offers › Submitted. |
| `05-payment.spec.ts` | The paywall reaching Stripe checkout. |

## What it does not do

- **It stops at Stripe, it does not pay.** A finished purchase unlocks that
  caregiver for good, so the next run would have nothing left to buy. Paying
  with a test card stays a manual check.
- **It writes real data.** Step 2 adds a document to the test caregiver on the
  environment it runs against. That is why the tests are deliberately serial:
  two runs buying the same packet at once would be testing the race, not the
  feature.

## Pointing it somewhere else

Everything is read from the environment, so nothing is pinned to one site.
Copy the values into `.env.e2e` (not committed) or set them in the shell:

| Variable | Default |
|---|---|
| `E2E_BASE_URL` | `https://qa.wevoro.com` |
| `E2E_API_URL` | `https://test-api.wevoro.com/api/v1` |
| `E2E_JOURNEY_EMAIL` | the caregiver the full run follows |
| `E2E_JOURNEY_PASSWORD` | that caregiver's password |
| `E2E_JOURNEY_SHARE` | that caregiver's share link id |
| `E2E_AGENCY_EMAIL` | the agency account |
| `E2E_PASSWORD` | password for the named test accounts |

For example, to run the same suite against a local dev server:

```bash
E2E_BASE_URL=http://localhost:3003 npm run test:e2e
```

## Reading a failure

A failed run keeps everything needed to see why:

- the failing step, with the line of the test, in the terminal
- a screenshot at the moment it failed
- a video of that test
- a trace — open it with `npx playwright show-trace`, and step through the run
  action by action

They are all in `e2e-report/`, opened with `npm run test:e2e:report`. That
folder is generated and stays out of the repository.
