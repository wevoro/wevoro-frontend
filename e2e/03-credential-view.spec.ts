import { test, expect } from '@playwright/test';
import { CAREGIVERS, signIn } from './fixtures/wevoro';

/**
 * SCRUM-123. "View Credential" used to fall back to href="#" whenever the file
 * was withheld, so clicking it reopened the same profile in a new tab. Both
 * states are pinned here: bought opens the file, not bought opens the locked
 * documents instead of reloading.
 */
test.describe('agency views a caregiver credential', () => {
  test.beforeEach(async ({ context, request }) => {
    await signIn(context, request, 'agency');
  });

  test('a bought packet links straight to the credential file', async ({ page }) => {
    await page.goto(`/agency/caregivers/${CAREGIVERS.paid.id}`);

    const view = page.locator('a, button').filter({ hasText: /^View (Credential|Record)/ }).first();
    await view.waitFor({ timeout: 90_000 });

    const href = await view.getAttribute('href');
    expect(href, 'the credential link must point at the file, never at "#"').toBeTruthy();
    expect(href).not.toBe('#');
    expect(href).toMatch(/^https?:\/\//);
  });

  test('an unbought packet previews the credential in place, with no download', async ({
    page,
    context,
  }) => {
    await page.goto(`/agency/caregivers/${CAREGIVERS.unpaid.id}`);

    const view = page.locator('a, button').filter({ hasText: /^View (Credential|Record)/ }).first();
    await view.waitFor({ timeout: 90_000 });
    expect(await view.getAttribute('href')).toBeNull();

    const before = context.pages().length;
    await view.click();

    // SCRUM-130: viewing is free, downloading is paid. An agency that has not
    // bought the packet reads the credential in an in-app preview that offers
    // no download — opening the file in a tab handed over the browser's own
    // download button, which made the paid packet worthless.
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toContainText(/Preview only/i);
    await expect(dialog.locator('iframe')).toHaveCount(1);
    await expect(dialog.locator('a[download]')).toHaveCount(0);
    expect(context.pages().length, 'clicking must not open another tab').toBe(before);
    await expect(page).toHaveURL(new RegExp(`/agency/caregivers/${CAREGIVERS.unpaid.id}`));
  });
});
