import { test, Page, APIRequestContext } from '@playwright/test';
import { signInAs } from './fixtures/wevoro';
test.use({ viewport: { width: 1440, height: 950 } });
test.setTimeout(240_000);
test.beforeEach(async ({ context }) => { await context.route(/usercentrics/i, (r) => r.abort()); });
const SHOTS = 'e:/antigravity/wevoro/sep27-shots';
const shot = async (p: Page, n: string, full = false) => {
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: full });
  console.log('>>> shot', n);
};
test('evidence for the 27 Sep page', async ({ page, request }) => {
  await page.goto('about:blank');
  await page.context().clearCookies();
  await signInAs(page.context(), request as APIRequestContext, 'qa.noah.price@wevoro-test.com', 'Wevoro@2026', 'pro' as never);
  await page.goto('/caregiver/notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await shot(page, 's189-notice-on-page', true);
});
