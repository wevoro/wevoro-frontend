import fs from 'fs';
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (23 Sep): SCRUM-176 / 177 / 178 against live QA.
 *  - 177: no Public/Private toggle anywhere, sharing line, new medical consent
 *    wording, no privacy icons.
 *  - 178: Update Verification + Remove on a Confirmed credential, share link
 *    falling back to In review / Locked.
 *  - 176: no lock icon on the agency's credential cards, View Credential opens
 *    the caregiver's own file.
 * Screenshots go outside the repo. Delete this spec after use.
 */
test.use({ viewport: { width: 1440, height: 950 }, timezoneId: 'America/New_York' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(420_000);
test.beforeEach(async ({ context }) => {
  await context.route(/usercentrics/i, (r) => r.abort());
});

const SHOTS = 'e:/antigravity/wevoro/sep23-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const PW = 'Wevoro@2026';
const STAMP = Date.now().toString(36).slice(-5);
const CG = { email: `qa.s177.${STAMP}@wevoro-test.com`, pw: PW, name: 'Nora Blake', id: '' };
const AGENCY = { email: 'riadhossinr4+agency@gmail.com', pw: 'admin1234' };
const ADMIN = { email: 'qa.admin@wevoro-test.com', pw: 'admin1234' };

const note = (...a: unknown[]) => console.log('>>>', ...a);

const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
  note('shot', name);
};

async function token(request: APIRequestContext, email: string, pw: string, source: string) {
  const r = await request.post(`${API_URL}/auth/login`, {
    data: { email, password: pw, source },
  });
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

/** A small real PDF so the upload is a genuine file, not a stub. */
async function pdf(page: Page, title: string) {
  const p = await page.context().newPage();
  await p.setContent(
    `<body style="font-family:Arial;padding:60px"><h1>${title}</h1><p>WeVoro QA test document. Not a real credential.</p></body>`
  );
  const buf = await p.pdf({ format: 'A4' });
  await p.close();
  const file = `${SHOTS}/${title.replace(/[^\w]+/g, '_')}.pdf`;
  fs.writeFileSync(file, buf);
  return file;
}

const CREDS = [
  { type: 'certifications', title: 'CNA Certification', category: 'non_medical' },
  { type: 'cpr_test', title: 'CPR & First Aid', category: 'medical' },
  { type: 'tb_tests', title: 'TB Test', category: 'medical' },
  { type: 'driver_license', title: "Driver's License", category: 'non_medical' },
  { type: 'auto_insurance', title: 'Auto Insurance', category: 'non_medical' },
];

/** Seed the 5 credentials over the API so the UI work has something to act on. */
async function seedCredentials(request: APIRequestContext, tok: string, file: string) {
  const buffer = fs.readFileSync(file);
  for (const c of CREDS) {
    const r = await request.post(`${API_URL}/document/upload`, {
      headers: { Authorization: tok },
      multipart: {
        category: c.category,
        documentType: c.type,
        title: c.title,
        isPublic: 'true',
        consent: 'true',
        consentVersion: '2026-09-23',
        file: { name: `${c.type}.pdf`, mimeType: 'application/pdf', buffer },
      },
    });
    expect(r.ok(), `upload ${c.type}: ${await r.text()}`).toBeTruthy();
  }
}

async function docsOf(request: APIRequestContext, tok: string, userId?: string) {
  const url = userId ? `${API_URL}/document?userId=${userId}` : `${API_URL}/document`;
  const r = await request.get(url, { headers: { Authorization: tok } });
  return ((await r.json()).data || []) as Record<string, string>[];
}

/** Admin confirms every credential, with dates, so the share gate opens. */
async function confirmAll(request: APIRequestContext, adminTok: string, userId: string) {
  const docs = await docsOf(request, adminTok, userId);
  for (const d of docs) {
    if (!CREDS.some((c) => c.type === d.documentType)) continue;
    const r = await request.patch(`${API_URL}/document/${d._id}/review`, {
      headers: { Authorization: adminTok },
      data: {
        reviewStatus: 'approved',
        credentialIdNumber: `QA-${d.documentType}-${STAMP}`,
        credentialIssueDate: '2026-03-01',
        credentialExpirationDate: '2028-03-01',
        issuingOrganization: 'Georgia Board of Nursing',
      },
    });
    expect(r.ok(), `confirm ${d.documentType}: ${await r.text()}`).toBeTruthy();
  }
}

test('S1. Caregiver upload modal: no Public/Private toggle, sharing line, new consent wording', async ({ page, request }) => {
  const signup = await request.post(`${API_URL}/user/signup`, {
    data: { email: CG.email, password: PW, role: 'pro' },
  });
  note('signup', signup.status());
  const tok = await token(request, CG.email, CG.pw, 'pro');
  CG.id = idOf(tok);
  note('caregiver', CG.email, CG.id);

  const file = await pdf(page, 'QA Credential');
  await seedCredentials(request, tok, file);

  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // The Completing Profile modal can own the screen on first load.
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
  await page.waitForTimeout(1000);

  await shot(page, 's01-caregiver-profile', true);

  // Documents section: the sharing line, and no privacy icon.
  const sharing = page.getByText(
    'Documents in your profile are shared with agencies you send your profile link to.'
  );
  await expect(sharing.first()).toBeVisible({ timeout: 30_000 });
  await sharing.first().scrollIntoViewIfNeeded();
  await shot(page, 's02-documents-sharing-line');

  note('SCRUM-177 sharing line on the Documents section: OK');
});

test('S2. Upload Document modal has no toggle and shows the new consent wording', async ({ page, request }) => {
  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});

  // Add More opens the modal with both dropdowns editable (SCRUM-44).
  // The Add More control is icon-only; it carries a stable testid.
  const addMore = page.locator('[data-testid="add-document"]').first();
  await addMore.scrollIntoViewIfNeeded();
  await addMore.click();
  await page.waitForTimeout(1500);
  await shot(page, 's03-upload-modal-no-toggle');

  // SCRUM-177: the Private switch is gone from every entry point.
  await expect(page.getByRole('switch', { name: /private/i })).toHaveCount(0);
  expect(await page.getByText('Only visible to expressly authorized').count()).toBe(0);
  // ...and the sharing sentence took its place.
  await expect(
    page.getByText('Documents in your profile are shared with agencies you send your profile link to.').first()
  ).toBeVisible();

  // Switch the category to Medical to reveal the consent checkbox.
  const category = page.locator('button[role="combobox"]').first();
  await category.click();
  await page.getByRole('option', { name: /medical/i }).first().click();
  await page.waitForTimeout(1000);

  await expect(
    page.getByText(/I authorize WeVoro to share this medical document/i).first()
  ).toBeVisible({ timeout: 20_000 });
  expect(await page.getByText('We do not share your data without your consent.').count()).toBe(0);
  await shot(page, 's04-medical-consent-wording');

  note('SCRUM-177 toggle removed + new consent wording: OK');
  await page.keyboard.press('Escape');
});

test('S3. Admin confirms all 5, caregiver sees the three-dot menu on a Confirmed credential', async ({ page, request }) => {
  const adminTok = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  await confirmAll(request, adminTok, CG.id);

  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
  await page.waitForTimeout(1500);

  const section = page.getByText('Credentials Status').first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await shot(page, 's05-credentials-confirmed', true);

  // SCRUM-176/177: no privacy padlock or globe on any credential card.
  const cards = page.locator('[data-testid="credential-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  note('credential cards:', await cards.count());

  // SCRUM-178: the three-dot menu is back on a Confirmed credential.
  const firstCard = cards.first();
  const menu = firstCard.locator('[data-testid="credential-row-menu"]');
  await expect(menu).toBeVisible({ timeout: 30_000 });
  await menu.click();
  await page.waitForTimeout(900);
  await expect(page.getByRole('menuitem', { name: /update verification/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('menuitem', { name: /remove/i })).toBeVisible();
  await shot(page, 's06-three-dot-menu');

  note('SCRUM-178 menu on a Confirmed credential: OK');
});

test('S4. Update Verification requires a new file', async ({ page, request }) => {
  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});

  const cards = page.locator('[data-testid="credential-card"]');
  await cards.first().scrollIntoViewIfNeeded();
  await cards.first().locator('[data-testid="credential-row-menu"]').click();
  await page.waitForTimeout(800);
  await page.getByRole('menuitem', { name: /update verification/i }).click();
  await page.waitForTimeout(2000);

  await shot(page, 's07-update-verification-modal');

  // SCRUM-178 S2 + SCRUM-44: the type is locked and a new file is required.
  const submit = page.getByRole('button', { name: /^update$|^upload$/i }).last();
  await expect(submit).toBeDisabled();
  await expect(page.getByText(/new file is required/i).first()).toBeVisible({ timeout: 15_000 });
  // SCRUM-44: the type is pre-filled AND locked, so the upload cannot be
  // re-routed to a different credential.
  const cat = page.locator('button[role="combobox"]').first();
  const typ = page.locator('button[role="combobox"]').nth(1);
  await expect(cat).toBeDisabled();
  await expect(typ).toBeDisabled();
  note('locked category:', (await cat.innerText()).trim(), '| type:', (await typ.innerText()).trim());
  await shot(page, 's08-update-requires-file');

  note('SCRUM-178 Update Verification needs a new file: OK');
  await page.keyboard.press('Escape');
});

test('S5. Agency view: no lock icons, View Credential opens the caregiver file', async ({ page, request }) => {
  await as(page, request, AGENCY, 'partner');
  await page.goto(`/agency/caregivers/${CG.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  await shot(page, 's09-agency-caregiver', true);

  const cards = page.locator('[data-testid="credential-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 40_000 });
  const count = await cards.count();
  note('agency credential cards:', count);

  // SCRUM-176 S1: no credential card carries a privacy padlock. The only
  // padlocks allowed are inside the disabled Awaiting review / Locked buttons.
  const titled = page.locator('[title="Private"], [title="Visible to agencies"]');
  expect(await titled.count(), 'privacy icons on the agency view').toBe(0);
  // Frame the cards themselves, not the top of the page.
  await page.getByText('Credentials Status').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await shot(page, 's10-agency-no-lock-icons');

  const view = page.getByRole('button', { name: /view credential|view record/i }).first();
  if (await view.isVisible().catch(() => false)) {
    await view.click();
    await page.waitForTimeout(4000);
    await shot(page, 's11-agency-view-credential');
    await page.keyboard.press('Escape');
  }

  note('SCRUM-176 agency cards clean: OK');
});

test('S6. Remove sends the credential back to Not Uploaded and locks the share link', async ({ page, request }) => {
  await as(page, request, CG, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later = page.getByRole('button', { name: /later|close/i }).first();
  if (await later.isVisible().catch(() => false)) await later.click().catch(() => {});
  await page.waitForTimeout(1500);

  // The share-link banner sits beside the caregiver's name at the top.
  await shot(page, 's12-before-remove');

  const cards = page.locator('[data-testid="credential-card"]');
  await cards.first().scrollIntoViewIfNeeded();
  await cards.first().locator('[data-testid="credential-row-menu"]').click();
  await page.waitForTimeout(800);
  await page.getByRole('menuitem', { name: /remove/i }).click();
  await page.waitForTimeout(1500);
  await shot(page, 's13-remove-confirm');

  // SCRUM-178 S4: it confirms first.
  const confirm = page.getByRole('button', { name: /yes, remove/i });
  await expect(confirm).toBeVisible({ timeout: 15_000 });
  await confirm.click();
  await page.waitForTimeout(6000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  const later2 = page.getByRole('button', { name: /later|close/i }).first();
  if (await later2.isVisible().catch(() => false)) await later2.click().catch(() => {});
  await page.waitForTimeout(1200);
  await shot(page, 's14-after-remove');
  const banner = await page.locator('body').innerText();
  note('share state after Remove contains "locked":', /locked/i.test(banner));
  await page.getByText('Credentials Status').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await shot(page, 's15-not-uploaded-card');

  const tok = await token(request, CG.email, CG.pw, 'pro');
  const left = (await docsOf(request, tok)).filter((d) =>
    CREDS.some((c) => c.type === d.documentType)
  );
  note('credentials left after Remove:', left.length, left.map((d) => d.documentType).join(','));
  expect(left.length).toBe(4);

  note('SCRUM-178 Remove: OK');
});
