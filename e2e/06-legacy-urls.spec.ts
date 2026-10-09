import { test, expect } from '@playwright/test';
import { CAREGIVERS, signIn } from './fixtures/wevoro';

/**
 * SCRUM-144. Pages moved from /pro and /partner to /caregiver and /agency.
 * Links in emails that were already sent, stored notification links and
 * bookmarks still use the old addresses, so every one of them must forward to
 * the new page, keeping its query string and #fragment target.
 */
const BASE = process.env.E2E_BASE_URL || 'https://qa.wevoro.com';

const LEGACY: Array<[string, string]> = [
  ['/pro/login', '/caregiver/login'],
  ['/pro/signup', '/caregiver/signup'],
  ['/pro/profile', '/caregiver/profile'],
  ['/pro/offers?tab=received', '/caregiver/offers?tab=received'],
  ['/pro/onboard/personal-info', '/caregiver/onboard/personal-info'],
  ['/pro/partner/abc123', '/caregiver/agencies/abc123'],
  ['/pro/abc123', '/caregiver/abc123'],
  ['/partner/login', '/agency/login'],
  ['/partner/access?mode=signin', '/agency/access?mode=signin'],
  ['/partner/onboardings', '/agency/onboardings'],
  ['/partner/documents', '/agency/documents'],
  ['/partner/pros', '/agency/caregivers'],
  ['/partner/pros/abc123?payment=cancelled&tx=1', '/agency/caregivers/abc123?payment=cancelled&tx=1'],
  ['/pros', '/caregivers'],
  ['/partners', '/agencies'],
  ['/admin/pros', '/admin/caregivers'],
  ['/admin/partners', '/admin/agencies'],
];

test('every old /pro and /partner address forwards to its new page', async ({ request }) => {
  for (const [from, to] of LEGACY) {
    const res = await request.get(`${BASE}${from}`, { maxRedirects: 0 });
    const location = res.headers()['location'] || '';
    expect(res.status(), `${from} should redirect`).toBe(307);
    expect(new URL(location, BASE).pathname + new URL(location, BASE).search, from).toBe(to);
  }
});

test('an old caregiver link opens the new agency page, signed in', async ({ page, request }) => {
  await signIn(page.context(), request, 'agency');
  await page.goto(`/partner/pros/${CAREGIVERS.unpaid.id}`);
  await expect(page).toHaveURL(new RegExp(`/agency/caregivers/${CAREGIVERS.unpaid.id}$`), {
    timeout: 60_000,
  });
  await expect(page.locator('[data-testid="onboard-bar"]')).toBeVisible({ timeout: 60_000 });
});

test('an old credential-alert link keeps its #credentials anchor', async ({ page, request }) => {
  await signIn(page.context(), request, 'caregiver');
  await page.goto('/pro/profile#credentials');
  await expect(page).toHaveURL(/\/caregiver\/profile#credentials$/, { timeout: 60_000 });
});

test('signed out, an old protected page asks the right login', async ({ page }) => {
  await page.goto('/partner/documents');
  await expect(page).toHaveURL(/\/agency\/(login|access)/, { timeout: 60_000 });
  await page.goto('/pro/profile');
  await expect(page).toHaveURL(/\/caregiver\/login/, { timeout: 60_000 });
});
