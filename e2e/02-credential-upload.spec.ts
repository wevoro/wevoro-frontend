import path from 'path';
import { test, expect } from '@playwright/test';
import { signIn } from './fixtures/wevoro';

/**
 * A caregiver adding a document. This is the write half of the credential
 * flow: everything else in the suite only reads what is already there, so
 * without this an upload could break and nothing would notice.
 */
test('a caregiver can upload a document', async ({ page, context, request }) => {
  await signIn(context, request, 'caregiver');
  await page.goto('/caregiver/profile');

  // The "Completing Profile" prompt covers the page on first load.
  const later = page.getByRole('button', { name: /^Later$/i });
  if (await later.count()) {
    await later.click().catch(() => {});
  }

  const title = `E2E upload ${Date.now()}`;

  // The Documents "+" tile. It carries data-testid once that build ships; until
  // then it is the only icon-only button with a plus, so match either.
  const addDocument = page
    .getByTestId('add-document')
    .or(page.locator('button:has(svg.lucide-plus)'))
    .first();
  await addDocument.scrollIntoViewIfNeeded();
  await addDocument.click();
  const modal = page.getByRole('dialog').last();
  await expect(modal.getByText('Upload Document')).toBeVisible();

  // Radix selects are buttons, not <select>: open, then pick the option.
  await modal.getByText('Select document type').click();
  await page.getByRole('option', { name: 'Other' }).click();

  await modal.getByPlaceholder('Type here..').fill(title);
  await modal
    .locator('input[type=file]')
    .setInputFiles(path.join(__dirname, 'fixtures', 'sample-credential.pdf'));

  await modal.getByRole('button', { name: /^Upload$/i }).click();

  // The upload is done when the dialog closes and the document is listed.
  await expect(modal).toBeHidden({ timeout: 120_000 });
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 60_000 });
});
