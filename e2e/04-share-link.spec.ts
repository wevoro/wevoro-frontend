import { test, expect } from '@playwright/test';
import { CAREGIVERS, signIn } from './fixtures/wevoro';

/**
 * SCRUM-122. An agency that arrives through a caregiver's share link must find
 * that caregiver on its Onboarding page, with a working way back to the
 * profile. Before the fix the tab stayed empty and the only route back was the
 * original link.
 *
 * SCRUM-141 (Faisal): the page is keyed by signing state — Awaiting signature
 * (with "Not onboarded yet" below it) and Completed — so the caregiver can be
 * on either tab depending on how far the onboarding got.
 */
test('a share link puts the caregiver on the Onboarding page', async ({ page, context, request }) => {
  await signIn(context, request, 'agency');

  // SCRUM-133: only a fully verified caregiver's link opens.
  await page.goto(`/p/${CAREGIVERS.verified.shareId}`);
  await expect(page).toHaveURL(/\/agency\/caregivers\//, { timeout: 90_000 });

  await page.goto('/agency/onboardings');
  await expect(page.getByTestId('subtab-awaiting')).toBeVisible({ timeout: 90_000 });
  // isVisible() does not wait, so let the list load first.
  await page.getByTestId('onboarding-row').first().waitFor({ timeout: 90_000 });
  const row = page
    .getByTestId('onboarding-row')
    .filter({ hasText: CAREGIVERS.verified.name })
    .first();
  if (!(await row.isVisible())) {
    await page.getByTestId('subtab-completed').click();
  }
  await expect(row).toBeVisible({ timeout: 30_000 });

  await row.getByRole('link', { name: CAREGIVERS.verified.name }).click();
  await expect(page).toHaveURL(/\/agency\/caregivers\/[a-f0-9]{12,}/, { timeout: 90_000 });
  await expect(page.getByText(/credentials status/i).first()).toBeVisible();
});

/**
 * SCRUM-133: a caregiver whose credentials are not all verified has no public
 * profile yet — not even for a signed-in agency, and nothing is recorded.
 */
test('a locked share link shows "not ready" and no profile', async ({ page, context, request }) => {
  await signIn(context, request, 'agency');

  await page.goto(`/p/${CAREGIVERS.unpaid.shareId}`);
  await expect(page.getByText(/isn.t ready to share yet/)).toBeVisible({ timeout: 90_000 });
  await expect(page).toHaveURL(new RegExp(`/p/${CAREGIVERS.unpaid.shareId}`));
  await expect(page.getByText(CAREGIVERS.unpaid.name.split(' ')[0])).toHaveCount(0);
});
