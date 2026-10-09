import path from 'path';
import { test, expect, Page, TestInfo } from '@playwright/test';
import {
  CAREGIVERS,
  JOURNEY,
  caregiverFromShare,
  packetStatus,
  signIn,
  signInAs,
} from './fixtures/wevoro';

/**
 * The whole WeVoro workflow, in the order it really happens.
 *
 * Every other spec in this folder checks one area on its own. This one walks
 * the product from end to end as a single story — a caregiver signs in, adds a
 * credential and shares her link; an agency arrives through that link, finds
 * her in Offers, hits the paywall and goes to Stripe — so one run answers the
 * question "does the site still work?".
 *
 * The steps run in order and each one is named, so the terminal reads like the
 * journey itself. Every step attaches a screenshot to the HTML report.
 */
test.describe.configure({ mode: 'serial' });

/** Keep a picture of every step, so the report shows the run, not just a tick. */
async function shot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
}

/** The "Completing Profile" prompt covers the caregiver page on first load. */
async function dismissProfilePrompt(page: Page) {
  const later = page.getByRole('button', { name: /^Later$/i });
  if (await later.count()) {
    await later
      .first()
      .click()
      .catch(() => {});
  }
}

test.describe('WeVoro full workflow', () => {
  test('Step 1 — the caregiver signs in on the login page', async ({
    page,
  }, testInfo) => {
    await page.goto('/caregiver/login');

    await page
      .locator('input[type=email], input[name=email]')
      .first()
      .fill(JOURNEY.email);
    await page.locator('input[type=password]').first().fill(JOURNEY.password);
    await page
      .getByRole('button', { name: /^(login|sign in)$/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/caregiver\/(profile|onboard)/, {
      timeout: 90_000,
    });
    await dismissProfilePrompt(page);
    await expect(
      page.getByText(/credentials status|personal information/i).first()
    ).toBeVisible();

    await shot(page, testInfo, 'caregiver-signed-in');
  });

  test('Step 2 — the caregiver adds a credential', async ({
    page,
    context,
    request,
  }, testInfo) => {
    await signInAs(context, request, JOURNEY.email, JOURNEY.password);
    await page.goto('/caregiver/profile');
    await dismissProfilePrompt(page);

    const title = `E2E workflow ${Date.now()}`;

    // The Documents "+" tile. It carries data-testid once that build ships;
    // until then it is the only icon-only button with a plus, so match either.
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
    await expect(page.getByText(title).first()).toBeVisible({
      timeout: 60_000,
    });

    await shot(page, testInfo, 'credential-uploaded');
  });

  test('Step 3 — the share link shows a safe public preview', async ({
    page,
    request,
  }, testInfo) => {
    // SCRUM-133: the journey caregiver's credentials are still in review, so
    // her link must show nothing about her — no name, no files.
    await page.goto(`/p/${JOURNEY.shareId}`);
    await expect(page.getByText(/isn.t ready to share yet/)).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByText(JOURNEY.name.split(' ')[0])).toHaveCount(0);
    await shot(page, testInfo, 'public-share-locked');

    // A fully verified caregiver's link opens the preview. No session on this
    // page: this is what a stranger with the link sees.
    const caregiver = await caregiverFromShare(request, CAREGIVERS.verified.shareId);
    expect(caregiver.id).toBeTruthy();
    await page.goto(`/p/${CAREGIVERS.verified.shareId}`);
    await expect(
      page.getByText(CAREGIVERS.verified.name.split(' ')[0]).first()
    ).toBeVisible({ timeout: 90_000 });

    // A preview may never hand out the files themselves.
    const body = await page.content();
    expect(
      body,
      'the public preview must not carry credential file links'
    ).not.toMatch(/b-cdn\.net|cloudinary\.com\/.*\/upload/i);

    await shot(page, testInfo, 'public-share-preview');
  });

  test('Step 4 — an agency opens the link and lands on the caregiver', async ({
    page,
    context,
    request,
  }, testInfo) => {
    await signIn(context, request, 'agency');

    // SCRUM-133: a locked link stays locked for an agency too.
    await page.goto(`/p/${JOURNEY.shareId}`);
    await expect(page.getByText(/isn.t ready to share yet/)).toBeVisible({
      timeout: 90_000,
    });

    // An unlocked one takes the agency straight to the caregiver.
    await page.goto(`/p/${CAREGIVERS.verified.shareId}`);
    await expect(page).toHaveURL(/\/agency\/caregivers\//, { timeout: 90_000 });
    await expect(
      page.getByText(/credentials status/i).first()
    ).toBeVisible();

    await shot(page, testInfo, 'agency-on-caregiver-profile');
  });

  test('Step 5 — the caregiver shows on the agency Onboarding page', async ({
    page,
    context,
    request,
  }, testInfo) => {
    // SCRUM-122. Before the fix the tab stayed empty after a share link.
    await signIn(context, request, 'agency');
    await page.goto('/agency/onboardings');

    // SCRUM-141 (Faisal): Awaiting signature (with "Not onboarded yet") or
    // Completed, depending on how far this pair has got.
    await expect(page.getByTestId('subtab-awaiting')).toBeVisible({ timeout: 90_000 });
    // isVisible() does not wait, so let the list load first.
    await page.getByTestId('onboarding-row').first().waitFor({ timeout: 90_000 });
    const row = page.getByTestId('onboarding-row').filter({ hasText: JOURNEY.name }).first();
    if (!(await row.isVisible())) {
      await page.getByTestId('subtab-completed').click();
    }
    await expect(row).toBeVisible({ timeout: 30_000 });

    await shot(page, testInfo, 'offers-submitted');
  });

  test('Step 6 — credentials stay locked until the agency pays', async ({
    page,
    context,
    request,
  }, testInfo) => {
    // SCRUM-123. "View Credential" used to fall back to href="#", so clicking
    // it reopened the same profile in a new tab instead of opening the file.
    const caregiver = { id: JOURNEY.id }; // SCRUM-133: her link no longer resolves while locked
    const { paid } = await packetStatus(request, caregiver.id);
    test.skip(
      paid,
      `${JOURNEY.name}'s packet is already bought on this environment`
    );

    await signIn(context, request, 'agency');
    await page.goto(`/agency/caregivers/${caregiver.id}`);

    // The journey caregiver's credentials are freshly uploaded, so usually still
    // Pending: SCRUM-63 gives an agency no view action on those, just a disabled
    // "Awaiting review". A confirmed one opens the free in-app preview (SCRUM-130).
    const view = page
      .locator('a, button')
      .filter({ hasText: /^(View (Credential|Record)|Awaiting review)/ })
      .first();
    await view.waitFor({ timeout: 90_000 });
    expect(
      await view.getAttribute('href'),
      'a locked credential must not be a link'
    ).toBeNull();

    const tabsBefore = context.pages().length;
    if (/Awaiting review/.test(await view.innerText())) {
      await expect(view).toBeDisabled();
    } else {
      await view.click();
      const preview = page.getByRole('dialog').last();
      await expect(preview).toContainText(/Preview only/i);
      await expect(preview.locator('a[download]')).toHaveCount(0);
      await page.keyboard.press('Escape');
    }
    expect(
      context.pages().length,
      'clicking must not open another tab'
    ).toBe(tabsBefore);

    // SCRUM-141: and no download exists on the profile at all. The old purple
    // Download Credential Package button is gone; the pinned bar offers
    // Onboard, a waiting state, or (once the caregiver has responded) the paid
    // download.
    await expect(
      page.getByRole('button', { name: /Download Credential Package/i })
    ).toHaveCount(0);
    // Faisal B1–B5: one slot — a button, or a status while it waits.
    const slot = page.locator('[data-testid="onboard-bar"]');
    await expect(
      slot
        .getByRole('button', { name: /^Onboard$|Download package|Download again|Complete your account/ })
        .or(slot.getByTestId('onboard-status'))
        .first()
    ).toBeVisible({ timeout: 60_000 });

    await shot(page, testInfo, 'credentials-locked');
  });

  test('Step 7 — paying for the packet opens Stripe checkout', async ({
    page,
    context,
    request,
  }, testInfo) => {
    // SCRUM-124. The run stops at Stripe rather than paying: a completed
    // purchase unlocks this caregiver for good and the next run would have
    // nothing left to buy. Paying with a test card stays a manual check.
    const caregiver = { id: JOURNEY.id }; // SCRUM-133: her link no longer resolves while locked
    const { paid } = await packetStatus(request, caregiver.id);
    test.skip(
      paid,
      `${JOURNEY.name}'s packet is already bought on this environment`
    );

    await signIn(context, request, 'agency');
    await page.goto(`/agency/caregivers/${caregiver.id}`);

    // SCRUM-141: the agency onboards first, and payment waits on the
    // caregiver's response. Until then there is a waiting state, not a price.
    const bar = page.locator('[data-testid="onboard-bar"]');
    const onboardBtn = bar.getByRole('button', { name: /^Onboard$/ });
    const download = bar.getByRole('button', { name: /Download package/ });
    // Faisal B2: waiting is a status, not a disabled button.
    const waitingBtn = bar.getByTestId('onboard-status');
    await expect(onboardBtn.or(download).or(waitingBtn).first()).toBeVisible({ timeout: 60_000 });
    if (await onboardBtn.isVisible()) {
      await onboardBtn.click();
      const prompt = page.getByRole('dialog').filter({ hasText: /Set up your/ });
      if (await prompt.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await prompt.getByRole('button', { name: 'Continue anyway' }).click();
      }
      await page
        .getByRole('dialog')
        .filter({ hasText: /Onboard / })
        .getByRole('button', { name: 'Send onboarding request' })
        .click();
    }
    if (!(await download.isVisible().catch(() => false))) {
      await expect(waitingBtn).toBeVisible({ timeout: 30_000 });
      await expect(waitingBtn).toContainText('Awaiting signature');
      await shot(page, testInfo, 'waiting-for-caregiver');
      return;
    }

    await download.click();
    const docs = page.getByRole('dialog').last();
    // Nothing from Stripe's error vocabulary belongs on a customer's screen.
    await expect(docs).not.toContainText(
      /line_items|tax code|acct_|dashboard\.stripe\.com/i
    );

    // SCRUM-131: the packet holds confirmed credentials only. The journey
    // caregiver's uploads are usually still awaiting review, and then there is
    // nothing to sell — the modal must say so and offer no purchase.
    const unlock = docs.getByRole('button', { name: /Unlock & download all/i });
    const waiting = docs.getByText(/waiting for WeVoro to confirm/i);
    await expect(unlock.or(waiting).first()).toBeVisible({ timeout: 60_000 });
    if (await waiting.isVisible()) {
      await expect(docs.getByRole('button', { name: /Nothing to unlock yet/i })).toBeDisabled();
      await shot(page, testInfo, 'packet-awaiting-review');
      return;
    }
    await shot(page, testInfo, 'payment-gate');

    // SCRUM-134 (revised): straight on to Stripe's own full-page checkout.
    await unlock.click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 90_000 });
    await expect(page.getByText(/credential packet/i).first()).toBeVisible({
      timeout: 60_000,
    });

    await shot(page, testInfo, 'stripe-checkout');
  });

  test('Step 8 — a paid packet opens the credential file itself', async ({
    page,
    context,
    request,
  }, testInfo) => {
    // The other side of the paywall, on a caregiver this agency has bought.
    await signIn(context, request, 'agency');
    await page.goto(`/agency/caregivers/${CAREGIVERS.paid.id}`);

    const view = page
      .locator('a, button')
      .filter({ hasText: /^View (Credential|Record)/ })
      .first();
    await view.waitFor({ timeout: 90_000 });

    const href = await view.getAttribute('href');
    expect(
      href,
      'a bought credential must link to the file, never to "#"'
    ).toBeTruthy();
    expect(href).not.toBe('#');
    expect(href).toMatch(/^https?:\/\//);

    await shot(page, testInfo, 'paid-credential-link');
  });
});
