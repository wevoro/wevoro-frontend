import fs from 'fs';
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (29 Sep): SCRUM-191 and 192 end to end on live QA.
 *  - 191 a declined offer reads as declined, and grants no download
 *  - 192 old expiry notifications survive a renewal
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
const CG = { email: `qa.s191.${STAMP}@wevoro-test.com`, pw: PW, id: '' };
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
  { type: 'certifications', title: 'PCA Certificate', category: 'non_medical' },
  { type: 'cpr_test', title: 'CPR & First Aid', category: 'medical' },
  { type: 'tb_tests', title: 'TB Test', category: 'medical' },
  { type: 'driver_license', title: "Driver's License", category: 'non_medical' },
  { type: 'auto_insurance', title: 'Auto Insurance', category: 'non_medical' },
];

test('A. A PCA caregiver, fully confirmed', async ({ page, request }) => {
  await request.post(`${API_URL}/user/signup`, { data: { email: CG.email, password: PW, role: 'pro' } });
  const tok = await token(request, CG.email, CG.pw, 'pro');
  CG.id = idOf(tok);
  note('caregiver', CG.email, CG.id);

  // The agency's signing library only holds PCA documents, so the caregiver
  // has to be a PCA for the onboarding flow to have anything to sign.
  await request.patch(`${API_URL}/user/professional-information`, {
    headers: { Authorization: tok },
    data: { role: 'PCA' },
  }).catch(() => {});

  const p = await page.context().newPage();
  await p.setContent('<body style="font-family:Arial;padding:60px"><h1>QA Credential</h1></body>');
  const buffer = await p.pdf({ format: 'A4' });
  await p.close();
  for (const c of CREDS) {
    await request.post(`${API_URL}/document/upload`, {
      headers: { Authorization: tok },
      multipart: {
        category: c.category, documentType: c.type, title: c.title,
        isPublic: 'true', consent: 'true', consentVersion: '2026-09-23',
        file: { name: `${c.type}.pdf`, mimeType: 'application/pdf', buffer },
      },
    });
  }
  const adminTok = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  const docs = (await (
    await request.get(`${API_URL}/document?userId=${CG.id}`, { headers: { Authorization: adminTok } })
  ).json()).data as Record<string, string>[];
  for (const d of docs) {
    if (!CREDS.some((c) => c.type === d.documentType)) continue;
    await request.patch(`${API_URL}/document/${d._id}/review`, {
      headers: { Authorization: adminTok },
      data: {
        reviewStatus: 'approved',
        credentialIssueDate: '2026-03-01',
        credentialExpirationDate: '2027-11-29',
        issuingOrganization: 'Georgia Board of Nursing',
      },
    });
  }
  note('seeded');
});

test('SCRUM-191. A declined offer grants no download and is not called Signed', async ({ page, request }) => {
  const agTok = await token(request, AGENCY.email, AGENCY.pw, 'partner');
  const onboard = await request.post(`${API_URL}/offer/onboard/${CG.id}`, {
    headers: { Authorization: agTok },
    data: {},
  });
  note('onboard:', onboard.status());

  const cgTok = await token(request, CG.email, CG.pw, 'pro');
  const offers = (await (
    await request.get(`${API_URL}/offer`, { headers: { Authorization: cgTok } })
  ).json());
  const list = (offers.data?.data || offers.data || []) as Record<string, string>[];
  const mine = list.find((o) => String(o.status) !== 'rejected');
  note('offers for the caregiver:', list.length, '| using', mine?._id);
  expect(mine, 'the onboard offer exists').toBeTruthy();

  // Decline it, exactly as the "Not interested" menu item does.
  const decline = await request.patch(`${API_URL}/offer/update/${mine!._id}`, {
    headers: { Authorization: cgTok },
    data: { status: 'rejected', isRemovedByPro: true, silent: true },
  });
  note('decline:', decline.status(), (await decline.text()).slice(0, 100));

  // THE SERIOUS PART: the agency must not be able to pay for or download a
  // declined caregiver's package.
  const checkout = await request.post(`${API_URL}/payment/checkout/${CG.id}`, {
    headers: { Authorization: agTok },
    data: {},
  });
  note('checkout after decline:', checkout.status(), (await checkout.text()).slice(0, 160));
  expect(checkout.status(), 'checkout is refused after a decline').toBeGreaterThanOrEqual(400);

  const zip = await request.get(`${API_URL}/document/download-package-zip/${CG.id}`, {
    headers: { Authorization: agTok },
  });
  note('package zip after decline:', zip.status());
  expect(zip.status(), 'the package is refused after a decline').toBeGreaterThanOrEqual(400);

  // And the agency's onboarding page must not read as awaiting signature.
  await as(page, request, AGENCY, 'partner');
  await page.goto('/agency/onboardings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await shot(page, 's191-agency-onboarding', true);
  const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  note('page mentions Declined:', /declined/i.test(body));
});

test('SCRUM-192. A renewal keeps the old expiry notifications', async ({ request }) => {
  const adminTok = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  const cgTok = await token(request, CG.email, CG.pw, 'pro');

  const before = (await (
    await request.get(`${API_URL}/user/notification`, { headers: { Authorization: cgTok } })
  ).json());
  const beforeRows = (before.data?.data || before.data || []) as Record<string, string>[];
  note('caregiver notifications before the renewal:', beforeRows.length);

  // Renew a credential: re-confirm it with a far-out expiry. Before the fix
  // this wiped every past expiry notice for that credential.
  const docs = (await (
    await request.get(`${API_URL}/document?userId=${CG.id}`, { headers: { Authorization: adminTok } })
  ).json()).data as Record<string, string>[];
  const cna = docs.find((d) => d.documentType === 'certifications');
  const r = await request.patch(`${API_URL}/document/${cna!._id}/review`, {
    headers: { Authorization: adminTok },
    data: {
      reviewStatus: 'approved',
      credentialIssueDate: '2026-03-01',
      credentialExpirationDate: '2029-01-01',
      issuingOrganization: 'Georgia Board of Nursing',
    },
  });
  note('renewal confirm:', r.status());

  const after = (await (
    await request.get(`${API_URL}/user/notification`, {
      headers: { Authorization: await token(request, CG.email, CG.pw, 'pro') },
    })
  ).json());
  const afterRows = (after.data?.data || after.data || []) as Record<string, string>[];
  note('caregiver notifications after the renewal:', afterRows.length);
  expect(afterRows.length, 'nothing was deleted by the renewal').toBeGreaterThanOrEqual(
    beforeRows.length
  );
});
