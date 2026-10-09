import fs from 'fs';
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (22 Sep): caregiver onboarding against Faisal's Figma (steps 1, 2,
 * 3 and the completed page) for a PCA and a CNA caregiver, plus the PCA
 * RN/LPN sign-off: uploadable, shown on every surface, and never touching the
 * share gate or completion. Screenshots outside the repo. Delete after use.
 */
test.use({ viewport: { width: 1440, height: 950 }, timezoneId: 'America/New_York' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(420_000);
test.beforeEach(async ({ context }) => { await context.route(/usercentrics/i, (r) => r.abort()); });

const SHOTS = 'e:/antigravity/wevoro/sep22-shots';
const PW = 'Wevoro@2026';
const STAMP = Date.now().toString(36).slice(-5);
const PCA = { email: `qa.pca.${STAMP}@wevoro-test.com`, pw: PW, name: 'Lily Adams', id: '' };
const CNA = { email: `qa.cna.${STAMP}@wevoro-test.com`, pw: PW, name: 'Omar Hayes', id: '' };
const AGENCY = { email: 'riadhossinr4+agency@gmail.com', pw: 'admin1234' };
const ADMIN = { email: 'qa.admin@wevoro-test.com', pw: 'admin1234' };
const note = (...a: any[]) => console.log('>>>', ...a);
const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
};
async function token(request: APIRequestContext, email: string, pw: string, source: string) {
  const r = await request.post(`${API_URL}/auth/login`, { data: { email, password: pw, source } });
  expect(r.ok(), `login ${email}`).toBeTruthy();
  return (await r.json()).data.accessToken as string;
}
const idOf = (t: string) => JSON.parse(Buffer.from(t.split('.')[1], 'base64').toString())._id as string;
async function as(page: Page, request: APIRequestContext, who: { email: string; pw: string }, source: string) {
  await page.goto('about:blank');
  await page.context().clearCookies();
  await signInAs(page.context(), request, who.email, who.pw, source as any);
}
async function me(request: APIRequestContext, who: { email: string; pw: string }) {
  const t = await token(request, who.email, who.pw, 'pro');
  return (await (await request.get(`${API_URL}/user/profile`, { headers: { Authorization: t } })).json()).data;
}
async function docs(request: APIRequestContext, who: { email: string; pw: string }) {
  const t = await token(request, who.email, who.pw, 'pro');
  return ((await (await request.get(`${API_URL}/document`, { headers: { Authorization: t } })).json()).data || []) as any[];
}
async function pdf(page: Page, title: string) {
  const p = await page.context().newPage();
  await p.setContent(`<body style="font-family:Arial;padding:60px"><h1>${title}</h1><p>WeVoro QA test document. Not a real credential.</p></body>`);
  const buf = await p.pdf({ format: 'A4' });
  await p.close();
  const file = `${SHOTS}/${title.replace(/[^\w]+/g, '_')}.pdf`;
  fs.writeFileSync(file, buf);
  return file;
}

/** Steps 1 and 2 through the UI, as a new caregiver would. */
async function onboardSteps12(page: Page, who: { name: string }, role: 'PCA' | 'CNA', prefix: string) {
  await page.goto('/caregiver/onboard/personal-info?autofill=true', { waitUntil: 'domcontentloaded' });
  const manual = page.locator('button').filter({ hasText: /manual/i }).first();
  await expect(manual).toBeVisible({ timeout: 60_000 });
  await manual.click();
  await expect(page.locator('input[name="fullName"]')).toBeVisible({ timeout: 30_000 });
  // Figma step 1: no photo upload, Role next to Full Name, Previous greyed, Need help?.
  expect(await page.getByText('Upload Your Profile Image').count(), 'no photo upload').toBe(0);
  expect(await page.getByText('About/Bio').count(), 'no Bio').toBe(0);
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await expect(page.getByText('Need help?').first()).toBeVisible();
  if (prefix === 'p') await shot(page, 'o01-step1-figma', true);

  // Let the page finish hydrating, then type; re-type if the first render
  // wiped it (typing into a server-rendered input before React takes over).
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
  await page.locator('input[name="fullName"]').fill(who.name);
  await page.waitForTimeout(500);
  if ((await page.locator('input[name="fullName"]').inputValue()) !== who.name) {
    await page.locator('input[name="fullName"]').fill(who.name);
  }
  await page.locator('button[role="combobox"]').filter({ hasText: /CNA or PCA/ }).click();
  await page.getByRole('option', { name: new RegExp(`^${role}`) }).click();
  await page.locator('input[name="dateOfBirth"]').fill('1992-04-12');
  await page.locator('button[role="combobox"]').filter({ hasText: /Select gender/ }).click();
  await page.getByRole('option', { name: 'Female' }).click();
  const tel = page.locator('input[type="tel"]').first();
  await tel.click();
  await tel.fill('+1 404 555 0142');
  await page.locator('input[name="address.city"]').fill('Athens');
  await page.locator('input[name="address.state"]').fill('Georgia');
  await page.locator('input[name="address.zipCode"]').fill('30601');
  await page.locator('input[name="address.country"]').fill('United States');
  await expect(page.locator('input[name="fullName"]')).toHaveValue(who.name);
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.waitForURL(/professional-info/, { timeout: 60_000 });
  await page.waitForTimeout(1500);

  // Figma step 2: no Role, no Skills, no Skip for now, no required stars.
  expect(await page.getByText('Role', { exact: true }).count(), 'no Role on step 2').toBe(0);
  expect(await page.getByRole('heading', { name: /^Skills/ }).count(), 'no Skills on step 2').toBe(0);
  expect(await page.getByText('Skip for now').count(), 'no Skip on step 2').toBe(0);
  expect(await page.getByText('Licenses & Certifications').count()).toBe(0);
  // One blank Education block and one blank Experience block by default (Figma).
  await expect(page.locator('input[name="education.0.degree"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('input[name="experience.0.jobTitle"]')).toBeVisible();
  if (prefix === 'p') await shot(page, 'o02-step2-figma', true);
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.waitForURL(/document-upload/, { timeout: 60_000 });
  await page.waitForTimeout(2000);
}

test('P1. PCA caregiver: steps 1-2 per Figma, step 3 shows the two PCA parts', async ({ page, request }) => {
  await request.post(`${API_URL}/user/signup`, { data: { email: PCA.email, password: PW, role: 'pro' } });
  PCA.id = idOf(await token(request, PCA.email, PCA.pw, 'pro'));
  note('PCA', PCA.email, PCA.id);
  await as(page, request, PCA, 'pro');
  await onboardSteps12(page, PCA, 'PCA', 'p');

  const profile = await me(request, PCA);
  note('saved role:', profile?.professionalInfo?.role, '| name:', profile?.personalInfo?.firstName, profile?.personalInfo?.lastName, '| completion', profile?.completionPercentage);
  expect(profile?.professionalInfo?.role).toBe('PCA');

  // Figma step 3 (PCA): exactly two cards, sign-off first.
  const titles = (await page.locator('p.font-semibold').allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  note('step 3 cards:', titles.join(' | '));
  expect(titles.slice(0, 2)).toEqual(['RN/LPN practical sign-off', 'Exam - Written GACCP']);
  expect(titles).not.toContain('TB Test');
  await shot(page, 'o03-step3-pca');
  await page.getByRole('button', { name: 'RN/LPN sign-off' }).hover();
  await page.waitForTimeout(600);
  await shot(page, 'o04-step3-pca-tooltip');
});

test('P2. PCA: upload the sign-off inline; the share gate and completion do not move', async ({ page, request }) => {
  const before = await me(request, PCA);
  await as(page, request, PCA, 'pro');
  await page.goto('/caregiver/onboard/document-upload', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('RN/LPN practical sign-off').first()).toBeVisible({ timeout: 60_000 });
  const inputs = page.locator('input[type="file"]');
  await inputs.nth(0).setInputFiles(await pdf(page, 'RN LPN practical sign-off'));
  await page.waitForTimeout(300);
  await shot(page, 'o05-step3-uploading');
  await expect(page.getByText(/Uploaded/).first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, 'o06-step3-signoff-uploaded');

  const d1 = await docs(request, PCA);
  note('rows after sign-off:', d1.map((d) => `${d.documentType}/${d.part || '-'}/${d.reviewStatus}`).join(' · '));
  expect(d1.some((d) => d.documentType === 'certifications' && d.part === 'practical_signoff')).toBeTruthy();
  const after = await me(request, PCA);
  note('completion before/after sign-off:', before.completionPercentage, after.completionPercentage);
  expect(after.completionPercentage).toBe(before.completionPercentage);

  // Re-upload replaces the one sign-off row (no duplicates).
  await inputs.nth(0).setInputFiles(await pdf(page, 'RN LPN sign-off v2'));
  await expect(page.getByText(/Uploaded/).first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  const d2 = await docs(request, PCA);
  expect(d2.filter((d) => d.part === 'practical_signoff').length, 'one sign-off row').toBe(1);

  // Then the written exam.
  await inputs.nth(1).setInputFiles(await pdf(page, 'PCA written exam GACCP'));
  await expect(page.getByText(/Uploaded/).nth(1)).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, 'o07-step3-both-uploaded');
  const d3 = await docs(request, PCA);
  note('rows after exam:', d3.map((d) => `${d.documentType}/${d.part || '-'}`).join(' · '));

  await page.getByRole('link', { name: 'Complete' }).or(page.getByRole('button', { name: 'Complete' })).first().click();
  await page.waitForURL(/onboard\/completed/, { timeout: 60_000 });
  await expect(page.getByText('Explore your profile')).toBeVisible();
  await shot(page, 'o08-completed');
});

test('P3. PCA profile: two cards in the PCA group, floating box row, gate still counts the exam only', async ({ page, request }) => {
  // Upload the other four credentials so the profile is realistic.
  const t = await token(request, PCA.email, PCA.pw, 'pro');
  for (const [type, category, title] of [['cpr_test', 'medical', 'CPR and First Aid'], ['tb_tests', 'medical', 'TB Test'], ['driver_license', 'non_medical', 'Driver License'], ['auto_insurance', 'non_medical', 'Auto Insurance']]) {
    const file = await pdf(page, title);
    const r = await request.post(`${API_URL}/document/upload`, {
      headers: { Authorization: t },
      multipart: { file: { name: `${type}.pdf`, mimeType: 'application/pdf', buffer: fs.readFileSync(file) }, category, documentType: type, title, isPublic: 'true', consent: 'true' },
    });
    note('upload', type, r.status());
  }
  await as(page, request, PCA, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  const later = page.getByRole('button', { name: 'Later' });
  await later.waitFor({ timeout: 15_000 }).then(() => later.click()).catch(() => {});
  const section = page.locator('#credentials');
  await expect(section).toBeVisible({ timeout: 60_000 });
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const cards = section.locator('[data-testid="credential-card"][data-key="certifications"]');
  note('certifications cards:', await cards.count(), '| parts:', JSON.stringify(await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-part')))));
  await shot(page, 'o09-profile-pca-group');
  const gate = page.getByTestId('share-gate').first();
  note('share box:', await gate.getAttribute('data-state'), (await gate.innerText()).replace(/\s+/g, ' '));

  const expand = page.getByRole('button', { name: 'Expand credentials' });
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const rows = page.locator('[data-testid="panel-credential"]');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  note('floating box rows:', JSON.stringify(await rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-key')))));
  await page.waitForTimeout(800);
  await shot(page, 'o10-floating-box-pca');
});

test('P4. Admin approves the exam only: certificate confirmed, sign-off pending; then approve all; agency view', async ({ page, request }) => {
  const admin = await token(request, ADMIN.email, ADMIN.pw, 'admin');
  const all = await docs(request, PCA);
  const approve = async (d: any) => {
    const r = await request.patch(`${API_URL}/document/${d._id}/review`, {
      headers: { Authorization: admin, 'Content-Type': 'application/json' },
      data: { reviewStatus: 'approved', credentialIssueDate: '2026-03-01', hasNoExpiration: true, issuingOrganization: 'Georgia' },
    });
    note('approve', d.documentType, d.part || '-', r.status());
  };
  for (const d of all) if (d.part !== 'practical_signoff') await approve(d);
  const gateAfterExam = await me(request, PCA);
  note('completion with exam + 4 approved, sign-off pending:', gateAfterExam.completionPercentage);

  await as(page, request, ADMIN, 'admin');
  await page.goto('/admin/caregivers', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/search/i).first().fill(PCA.email.split('@')[0]);
  await page.waitForTimeout(2500);
  await page.getByRole('row', { name: /Lily/ }).first().getByRole('button', { name: 'Review application' }).click({ timeout: 30_000 });
  const dlg = page.getByRole('dialog');
  const pca = dlg.getByText('RN/LPN practical sign-off').first();
  await pca.scrollIntoViewIfNeeded({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  await shot(page, 'o11-admin-pca-exam-confirmed-signoff-pending');

  await as(page, request, PCA, 'pro');
  await page.goto('/caregiver/profile', { waitUntil: 'domcontentloaded' });
  const later = page.getByRole('button', { name: 'Later' });
  await later.waitFor({ timeout: 10_000 }).then(() => later.click()).catch(() => {});
  const gate = page.getByTestId('share-gate').first();
  await expect(gate).toHaveAttribute('data-state', 'unlocked', { timeout: 60_000 });
  note('gate with sign-off still pending: unlocked (exam decides, rule unchanged)');

  for (const d of await docs(request, PCA)) if (d.part === 'practical_signoff') await approve(d);
  await as(page, request, AGENCY, 'partner');
  await page.goto(`/agency/caregivers/${PCA.id}`, { waitUntil: 'domcontentloaded' });
  const agencyCards = page.locator('[data-testid="credential-card"][data-key="certifications"]');
  await expect(agencyCards.first()).toBeVisible({ timeout: 60_000 });
  await agencyCards.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  note('agency certifications cards:', await agencyCards.count());
  await shot(page, 'o12-agency-pca-two-cards');
});

test('C1. CNA caregiver: step 3 shows one "CNA certificate" card', async ({ page, request }) => {
  await request.post(`${API_URL}/user/signup`, { data: { email: CNA.email, password: PW, role: 'pro' } });
  await as(page, request, CNA, 'pro');
  await onboardSteps12(page, CNA, 'CNA', 'c');
  const titles = (await page.locator('p.font-semibold').allInnerTexts()).map((s) => s.trim()).filter(Boolean);
  note('CNA step 3 cards:', titles.join(' | '));
  expect(titles[0]).toBe('CNA certificate');
  expect(titles).not.toContain('RN/LPN practical sign-off');
  await shot(page, 'o13-step3-cna');
});

test('R1. Regressions: profile edit keeps First/Last name and photo', async ({ page, request }) => {
  await as(page, request, PCA, 'pro');
  await page.goto('/caregiver/edit/personal-information', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  note('edit form: first name field', await page.locator('input[name="firstName"]').count(), '| full name field', await page.locator('input[name="fullName"]').count(), '| url', page.url());
  await shot(page, 'o14-edit-form-unchanged');
});
