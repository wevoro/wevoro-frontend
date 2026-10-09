import { test, expect } from '@playwright/test';
import { ACCOUNTS, PASSWORD } from './fixtures/wevoro';

/**
 * The login form itself. Every other test takes its session from the API, so
 * this is the one place the real screen is driven end to end.
 */
test('a caregiver can sign in from the login page', async ({ page }) => {
  await page.goto('/caregiver/login');

  await page.locator('input[type=email], input[name=email]').first().fill(ACCOUNTS.caregiver);
  await page.locator('input[type=password]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /^(login|sign in)$/i }).first().click();

  await expect(page).toHaveURL(/\/caregiver\/(profile|onboard)/, { timeout: 90_000 });
  await expect(page.getByText(/credentials status|personal information/i).first()).toBeVisible();
});

test('a wrong password is refused', async ({ page }) => {
  await page.goto('/caregiver/login');

  await page.locator('input[type=email], input[name=email]').first().fill(ACCOUNTS.caregiver);
  await page.locator('input[type=password]').first().fill('definitely-not-the-password');
  await page.getByRole('button', { name: /^(login|sign in)$/i }).first().click();

  await page.waitForTimeout(6000);
  await expect(page).toHaveURL(/\/caregiver\/login/);
});
