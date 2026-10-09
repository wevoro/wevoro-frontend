import { test, expect } from '@playwright/test';
import { CAREGIVERS, ensureResponded, packetStatus, signIn } from './fixtures/wevoro';

/**
 * SCRUM-124 / SCRUM-134. The purchase goes to Stripe's own full-page checkout
 * (kept by the client's revised decision on SCRUM-134), and nothing on the way
 * there may show the agency a payment provider's internal error.
 *
 * The test stops at Stripe rather than paying: a completed purchase would
 * unlock this caregiver permanently and the next run would have nothing left
 * to buy. Paying with a test card is the manual step in the release check.
 *
 * SCRUM-141: payment only opens once the caregiver has responded to the
 * agency's Onboard, so the pair is put in that state first.
 */
test('buying a packet reaches Stripe checkout', async ({ page, request }, testInfo) => {
  const { paid } = await packetStatus(request, CAREGIVERS.unpaid.id);
  test.skip(paid, `${CAREGIVERS.unpaid.name}'s packet is already bought on this environment`);
  await ensureResponded(request, CAREGIVERS.unpaid);

  await signIn(page.context(), request, 'agency');
  await page.goto(`/agency/caregivers/${CAREGIVERS.unpaid.id}`);

  // Faisal B3: "🔒 Download package · $price".
  await page
    .locator('[data-testid="onboard-bar"]')
    .getByRole('button', { name: /Download package/i })
    .click({ timeout: 60_000 });
  const docs = page.getByRole('dialog').last();
  // Nothing from Stripe's error vocabulary belongs on the way to checkout.
  await expect(docs).not.toContainText(/line_items|tax code|acct_|dashboard\.stripe\.com/i);
  await page.getByRole('button', { name: /Unlock & download all/i }).click({ timeout: 60_000 });

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 90_000 });
  await expect(page.getByText(/credential packet/i).first()).toBeVisible({ timeout: 60_000 });

  await testInfo.attach('stripe-checkout', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

/**
 * SCRUM-134 — Back must not loop into Stripe.
 *
 * Stripe's "←" link returns to our cancel URL by navigating forward, which used
 * to leave the tab as [page the agency came from] [profile] [Stripe] [profile].
 * The agency saw the profile, pressed Back, and landed on Stripe again. The
 * return now steps back past the Stripe entry, so one Back from the profile
 * reaches the page the agency actually came from.
 */
test('Back from checkout returns to where the agency came from', async ({ page, request }) => {
  const { paid } = await packetStatus(request, CAREGIVERS.unpaid.id);
  test.skip(paid, `${CAREGIVERS.unpaid.name}'s packet is already bought on this environment`);
  await ensureResponded(request, CAREGIVERS.unpaid);

  await signIn(page.context(), request, 'agency');
  await page.goto('/agency/onboardings');
  const cameFrom = new URL(page.url()).pathname;
  await page.goto(`/agency/caregivers/${CAREGIVERS.unpaid.id}`);

  await page
    .locator('[data-testid="onboard-bar"]')
    .getByRole('button', { name: /Download package/i })
    .click({ timeout: 60_000 });
  await page.getByRole('button', { name: /Unlock & download all/i }).click({ timeout: 60_000 });
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 90_000 });

  // Leave through Stripe's own back link, exactly as an agency would.
  const cancel = page.locator('a[href*="payment=cancelled"]').first();
  await cancel.waitFor({ timeout: 60_000 });
  await cancel.click();

  // Lands on the profile, with the stale query gone and not stacked on Stripe.
  await page.waitForURL((u) => u.pathname === `/agency/caregivers/${CAREGIVERS.unpaid.id}` && !u.search.includes('payment='), {
    timeout: 60_000,
  });

  await page.goBack();
  await page.waitForLoadState('domcontentloaded');
  expect(page.url()).not.toMatch(/checkout\.stripe\.com/);
  expect(new URL(page.url()).pathname).toBe(cameFrom);
});
