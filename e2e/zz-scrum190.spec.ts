import fs from 'fs';
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (29 Sep): SCRUM-190, 191, 192, 193, 200, 202 against live QA.
 * Delete after use.
 */
test.use({ viewport: { width: 1440, height: 950 }, timezoneId: 'America/New_York' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(420_000);
test.beforeEach(async ({ context }) => {
  await context.route(/usercentrics/i, (r) => r.abort());
});

const SHOTS = 'e:/antigravity/wevoro/sep29-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const PW = 'Wevoro@2026';
const STAMP = Date.now().toString(36).slice(-5);
const CG = { email: `qa.s29.${STAMP}@wevoro-test.com`, pw: PW, id: '' };
const AGENCY = { email: 'riadhossinr4+agency@gmail.com', pw: 'admin1234' };
const ADMIN = { email: 'qa.admin@wevoro-test.com', pw: 'admin1234' };

const note = (...a: unknown[]) => console.log('>>>', ...a);
const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
  note('shot', name);
};

async function token(request: APIRequestContext, email: string, pw: string, source: string) {
  const r = await request.post(`${API_URL}/auth/login`, { data: { email, password: pw, source } });
  expect(r.ok(), `login ${email}`).toBeTruthy();
  return (await r.json()).data.accessToken as string;
}
const idOf = (t: string) =>
  JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString())._id as string;

async function as(page: Page, request: APIRequestContext, who: { email: string; pw: string }, source: string) {
  await page.goto('about:blank');
  await page.context().clearCookies();
  await signInAs(page.context(), request, who.email, who.pw, source as never);
}

const CREDS = [
  { type: 'certifications', title: 'CNA Certification', category: 'non_medical' },
  { type: 'cpr_test', title: 'CPR & First Aid', category: 'medical' },
  { type: 'tb_tests', title: 'TB Test', category: 'medical' },
  { type: 'driver_license', title: "Driver's License", category: 'non_medical' },
  { type: 'auto_insurance', title: 'Auto Insurance', category: 'non_medical' },
];

test('A. Seed a caregiver with confirmed credentials and no bio', async ({ page, request }) => {
  await request.post(`${API_URL}/user/signup`, { data: { email: CG.email, password: PW, role: 'pro' } });
  const tok = await token(request, CG.email, CG.pw, 'pro');
  CG.id = idOf(tok);
  note('caregiver', CG.email, CG.id);

  const p = await page.context().newPage();
  await p.setContent('<body style="font-family:Arial;padding:60px"><h1>QA Credential</h1></body>');
  const buffer = await p.pdf({ format: 'A4' });
  await p.close();

  for (const c of CREDS) {
    const r = await request.post(`${API_URL}/document/upload`, {
      headers: { Authorization: tok },
      multipart: {
        category: c.category, documentType: c.type, title: c.title,
        isPublic: 'true', consent: 'true', consentVersion: '2026-09-23',
        file: { name: `${c.type}.pdf`, mimeType: 'application/pdf', buffer },
      },
    });
    expect(r.ok(), `upload ${c.type}`).toBeTruthy();
  }

  const adminTok = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  const docs = (await (
    await request.get(`${API_URL}/document?userId=${CG.id}`, { headers: { Authorization: adminTok } })
  ).json()).data as Record<string, string>[];
  for (const d of docs) {
    if (!CREDS.some((c) => c.type === d.documentType)) continue;
    const r = await request.patch(`${API_URL}/document/${d._id}/review`, {
      headers: { Authorization: adminTok },
      data: {
        reviewStatus: 'approved',
        credentialIdNumber: `QA-${d.documentType}-${STAMP}`,
        credentialIssueDate: '2026-03-01',
        credentialExpirationDate: '2027-11-29',
        issuingOrganization: 'Georgia Board of Nursing',
      },
    });
    expect(r.ok(), `confirm ${d.documentType}`).toBeTruthy();
  }
  note('seeded and confirmed');
});

test('SCRUM-202. Confirmed by Wevoro shows for the caregiver only', async ({ page, request }) => {
  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
  await page.getByText('Credentials Status').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await shot(page, 's202-caregiver-card');

  const lines = page.locator('[data-testid="credential-confirmed-on"]');
  const n = await lines.count();
  note('confirmed-by lines on the caregiver card:', n);
  if (n) note('text:', (await lines.first().innerText()).trim());
  expect(n, 'the caregiver sees the confirmation line').toBeGreaterThan(0);

  // SCRUM-63: the agency must NOT see it.
  await as(page, request, AGENCY, 'partner');
  await page.goto(`/agency/caregivers/${CG.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await page.getByText('Credentials Status').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const agencyLines = await page.locator('[data-testid="credential-confirmed-on"]').count();
  note('confirmed-by lines on the agency card:', agencyLines);
  expect(agencyLines, 'the agency still does not see it').toBe(0);
  await shot(page, 's202-agency-card');
});

test('SCRUM-190. An empty bio is hidden, not shown as N/A', async ({ page, request }) => {
  await as(page, request, AGENCY, 'partner');
  await page.goto(`/agency/caregivers/${CG.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const personal = page.getByText('Personal information').first();
  await personal.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await shot(page, 's190-personal-info');

  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const hasBioHeading = /\bBio\b/.test(body);
  const hasNA = /\bN\/A\b/.test(body);
  note('Bio heading present:', hasBioHeading, '| any N/A on the page:', hasNA);
  expect(body, 'no raw N/A under Bio').not.toMatch(/Bio\s*N\/A/i);
});

test('SCRUM-200. Feedback button on Privacy and Terms while signed in', async ({ page, request }) => {
  await as(page, request, CG, 'pro');
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4500);
    const btn = page.locator('button, [role="button"]').filter({ has: page.locator('img, svg') });
    const all = await page.locator('body').innerText();
    // The floating button is fixed-position at the bottom right.
    // The button is a fixed-position wrapper, not necessarily a <button>, so
    // look at every element rather than a guessed tag list.
    const floating = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).filter((e) => {
        const st = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        return (
          st.position === 'fixed' &&
          r.width > 30 && r.width < 140 &&
          r.height > 30 && r.height < 140 &&
          r.bottom > window.innerHeight - 220 &&
          r.right > window.innerWidth - 240
        );
      }).length;
    });
    note(path, '— fixed bottom-right controls:', floating, '| page length', all.length);
    await shot(page, `s200${path.replace('/', '-')}`);
    expect(floating, `feedback button on ${path}`).toBeGreaterThan(0);
  }
});

test('SCRUM-193. Background check reports the review state', async ({ page, request }) => {
  const tok = await token(request, CG.email, CG.pw, 'pro');
  const p = await page.context().newPage();
  await p.setContent('<body style="font-family:Arial;padding:60px"><h1>GCHEXS</h1></body>');
  const buffer = await p.pdf({ format: 'A4' });
  await p.close();
  const up = await request.post(`${API_URL}/document/upload`, {
    headers: { Authorization: tok },
    multipart: {
      category: 'non_medical', documentType: 'gchexs', title: 'GCHEXS Confirmation',
      isPublic: 'true', consent: 'true',
      file: { name: 'gchexs.pdf', mimeType: 'application/pdf', buffer },
    },
  });
  note('gchexs upload', up.status());
  await request.patch(`${API_URL}/user/gchexs`, {
    headers: { Authorization: tok },
    data: { gchexsStatus: 'yes' },
  }).catch(() => {});

  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
  const bg = page.getByText('Background check').first();
  if (await bg.isVisible().catch(() => false)) {
    await bg.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
  }
  await shot(page, 's193-background-check', true);
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const qualifier = /Pending WeVoro review|Reviewed by WeVoro|Not confirmed by WeVoro/.exec(body);
  note('background check qualifier:', qualifier?.[0] || 'none found');
});
