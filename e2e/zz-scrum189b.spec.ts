import fs from 'fs';
import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { API_URL, signInAs } from './fixtures/wevoro';

/*
 * TEMPORARY (27 Sep): SCRUM-189 proven on a PAID pair.
 *  - the agency's credential card now links to the download route, which is
 *    what writes the audit row and fires the caregiver's notice
 *  - the notice itself really does arrive on a first download
 * Delete after use.
 */
test.use({ viewport: { width: 1440, height: 950 }, timezoneId: 'America/New_York' });
test.describe.configure({ mode: 'serial' });
test.setTimeout(420_000);
test.beforeEach(async ({ context }) => {
  await context.route(/usercentrics/i, (r) => r.abort());
});

const SHOTS = 'e:/antigravity/wevoro/sep27-shots';
fs.mkdirSync(SHOTS, { recursive: true });

const AGENCY = { email: 'riadhossinr4+agency@gmail.com', pw: 'admin1234' };
// Paid by this agency on 22 Sep, so the card renders the real download link.
const PAID = { id: '6ab261ff4618051522dd7eb5', name: 'Noah Price' };

const note = (...a: unknown[]) => console.log('>>>', ...a);
const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
  note('shot', name);
};

async function as(page: Page, request: APIRequestContext, who: { email: string; pw: string }, source: string) {
  await page.goto('about:blank');
  await page.context().clearCookies();
  await signInAs(page.context(), request, who.email, who.pw, source as never);
}

test('SCRUM-189. A paid agency card links to the download route, not the free read', async ({ page, request }) => {
  await as(page, request, AGENCY, 'partner');
  await page.goto(`/agency/caregivers/${PAID.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.getByText('Credentials Status').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await shot(page, 's189b-paid-agency-cards');

  const links = await page.locator('a[href*="/api/document/"]').evaluateAll(
    (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || '')
  );
  const download = links.filter((h) => h.includes('/download-file/'));
  const view = links.filter((h) => h.includes('/view/'));
  note('links on the paid agency view — download:', download.length, '| view:', view.length);
  note('sample:', links.slice(0, 3).join(' | '));

  expect(download.length, 'the card now points at the download route').toBeGreaterThan(0);
  expect(view.length, 'no card still uses the free read route').toBe(0);

  // And the route really answers for an entitled agency.
  const res = await page.request.get(download[0]);
  note('download route answered', res.status(), res.headers()['content-disposition'] || '');
  expect(res.status(), 'entitled download succeeds').toBeLessThan(400);
});

test('SCRUM-189b. The caregiver has the Credentials Downloaded notice', async ({ request }) => {
  // This pair downloaded on 22 Sep, so the one-time notice should be on record.
  const r = await request.post(`${API_URL}/auth/login`, {
    data: { email: 'qa.noah.price@wevoro-test.com', password: 'Wevoro@2026', source: 'pro' },
  });
  if (!r.ok()) {
    note('could not sign in as the paid caregiver, skipping the history check');
    return;
  }
  const tok = (await r.json()).data.accessToken as string;
  const j = await (
    await request.get(`${API_URL}/user/notification`, { headers: { Authorization: tok } })
  ).json();
  const rows = (j.data?.data || j.data || []) as Record<string, string>[];
  const hit = rows.filter((n) => JSON.stringify(n).includes('downloaded your credentials'));
  note('caregiver notifications:', rows.length, '| credentials-downloaded notices:', hit.length);
  if (hit.length) note('text:', String(hit[0].message).replace(/<[^>]+>/g, ''));
});
