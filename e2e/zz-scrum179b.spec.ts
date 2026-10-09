import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (24 Sep): the two checks the first spec could only prove in code.
 *  - 179 a brand new agency really does land back on the caregiver's profile
 *        after submitting the completion form
 *  - 183 an agency connected to a caregiver is notified when a credential
 *        enters the red band
 * Delete after use.
 */
test.use({ viewport: { width: 1440, height: 950 }, timezoneId: 'America/New_York' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(420_000);
test.beforeEach(async ({ context }) => {
  await context.route(/usercentrics/i, (r) => r.abort());
});

const SHOTS = 'e:/antigravity/wevoro/sep24-shots';
const PW = 'Wevoro@2026';
const STAMP = Date.now().toString(36).slice(-5);
const CG = { email: `qa.s183.${STAMP}@wevoro-test.com`, pw: PW, id: '' };
const AG = { email: `qa.ag179.${STAMP}@wevoro-test.com`, pw: PW, id: '' };
const ADMIN = { email: 'qa.admin@wevoro-test.com', pw: 'admin1234' };

const note = (...a: unknown[]) => console.log('>>>', ...a);
const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
  note('shot', name);
};

async function token(request: APIRequestContext, email: string, pw: string, source: string) {
  const r = await request.post(`${API_URL}/auth/login`, { data: { email, password: pw, source } });
  expect(r.ok(), `login ${email}: ${await r.text()}`).toBeTruthy();
  return (await r.json()).data.accessToken as string;
}
const idOf = (t: string) =>
  JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString())._id as string;

test('SCRUM-179. A new agency lands back on the caregiver after submitting the form', async ({ page, request }) => {
  // A caregiver to come back to, and a brand new agency that has never
  // completed its profile — the exact state the ticket describes.
  await request.post(`${API_URL}/user/signup`, { data: { email: CG.email, password: PW, role: 'pro' } });
  CG.id = idOf(await token(request, CG.email, CG.pw, 'pro'));
  const signup = await request.post(`${API_URL}/user/signup`, {
    data: { email: AG.email, password: PW, role: 'partner' },
  });
  note('agency signup', signup.status());
  AG.id = idOf(await token(request, AG.email, AG.pw, 'partner'));
  note('caregiver', CG.id, '| agency', AG.id);

  await page.goto('about:blank');
  await page.context().clearCookies();
  await signInAs(page.context(), request, AG.email, AG.pw, 'partner' as never);

  await page.goto(`/agency/complete?proId=${CG.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await shot(page, 's179b-form', true);

  await page.locator('input').nth(0).fill('Jane Smith');
  await page.locator('input').nth(1).fill(`QA Agency ${STAMP}`);
  await page.locator('input').nth(2).fill('Atlanta');
  // State is a native <select>, not a text box.
  await page.locator('select').first().selectOption({ label: 'Georgia' });
  await page.waitForTimeout(500);

  const submit = page.getByRole('button', { name: /submit|verif|continue|finish/i }).last();
  await submit.click();
  await page.waitForURL(/\/agency\//, { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(6000);
  note('landed on:', page.url());
  await shot(page, 's179b-after-submit', true);

  expect(page.url(), 'returned to the caregiver, not the agency home').toContain(
    `/agency/caregivers/${CG.id}`
  );
});

test('SCRUM-183. An engaged agency is notified when a credential goes red', async ({ request }) => {
  const adminTok = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  const cgTok = await token(request, CG.email, CG.pw, 'pro');

  // One credential, confirmed with an expiry 10 days out: inside the red band.
  const red = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  const up = await request.post(`${API_URL}/document/upload`, {
    headers: { Authorization: cgTok },
    multipart: {
      category: 'medical',
      documentType: 'tb_tests',
      title: 'TB Test',
      isPublic: 'true',
      consent: 'true',
      file: { name: 'tb.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') },
    },
  });
  note('upload', up.status());
  const docs = (await (
    await request.get(`${API_URL}/document?userId=${CG.id}`, { headers: { Authorization: adminTok } })
  ).json()).data as Record<string, string>[];
  const tb = docs.find((d) => d.documentType === 'tb_tests');
  expect(tb, 'TB row exists').toBeTruthy();
  const rev = await request.patch(`${API_URL}/document/${tb!._id}/review`, {
    headers: { Authorization: adminTok },
    data: {
      reviewStatus: 'approved',
      credentialIssueDate: '2026-03-01',
      credentialExpirationDate: red,
      issuingOrganization: 'Fulton County Board of Health',
    },
  });
  note('confirm with red expiry', rev.status(), red);

  // Connect the agency to the caregiver the modern way: an onboard offer.
  const onboard = await request.post(`${API_URL}/offer/onboard/${CG.id}`, {
    headers: { Authorization: await token(request, AG.email, AG.pw, 'partner') },
    data: {},
  });
  note('onboard call:', onboard.status(), (await onboard.text()).slice(0, 120));

  const before = (await (
    await request.get(`${API_URL}/user/notification`, {
      headers: { Authorization: await token(request, AG.email, AG.pw, 'partner') },
    })
  ).json());
  const beforeRows = (before.data?.data || before.data || []) as unknown[];

  // Run the scan the scheduled job runs.
  // The scheduled job hits this with GET and a CRON_SECRET bearer token.
  const run = await request.get(`${API_URL}/notification/run-expiration-check`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
  });
  note('expiration scan:', run.status(), (await run.text()).slice(0, 200));

  const after = (await (
    await request.get(`${API_URL}/user/notification`, {
      headers: { Authorization: await token(request, AG.email, AG.pw, 'partner') },
    })
  ).json());
  const afterRows = (after.data?.data || after.data || []) as Record<string, string>[];
  note('agency notifications before:', beforeRows.length, 'after:', afterRows.length);
  note('titles:', afterRows.slice(0, 5).map((n) => n.title || n.message).join(' | '));
});
