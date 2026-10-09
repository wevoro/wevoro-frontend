import { BrowserContext, APIRequestContext, expect } from '@playwright/test';

/** The API the target site talks to. QA by default. */
export const API_URL =
  process.env.E2E_API_URL || 'https://test-api.wevoro.com/api/v1';

/** QA test accounts all share one password. Override it in .env.e2e. */
export const PASSWORD = process.env.E2E_PASSWORD || 'admin1234';

export const ACCOUNTS = {
  agency: process.env.E2E_AGENCY_EMAIL || 'riadhossinr4+agency@gmail.com',
  // riadhossinr4@gmail.com is the AGENCY account on QA; the caregiver tests
  // need a real caregiver, so they use one of the six QA test caregivers.
  caregiver: process.env.E2E_CAREGIVER_EMAIL || 'wevoro.cna.grace@gmail.com',
};

/**
 * Caregivers the agency account is already connected to on QA.
 *
 *  - `paid`   — the agency has bought this packet, so files are unlocked.
 *  - `unpaid` — still behind the paywall, which is what the locked-view and
 *               payment tests need.
 */
export const CAREGIVERS = {
  paid: {
    id: process.env.E2E_PAID_CAREGIVER_ID || '6a9ae7b8b4eef4d97c355dd5',
    name: process.env.E2E_PAID_CAREGIVER_NAME || 'Tobias Lindgren',
  },
  /**
   * SCRUM-133: a caregiver with all 5 credentials verified. Only such a link
   * opens now — every other share link shows "not ready to share". Already
   * paid for by the agency, so opening her link as the agency changes nothing.
   */
  verified: {
    id: process.env.E2E_VERIFIED_CAREGIVER_ID || '6aae84cc6d00f3427f60e78e',
    name: process.env.E2E_VERIFIED_CAREGIVER_NAME || 'Grace Mitchell',
    shareId:
      process.env.E2E_VERIFIED_CAREGIVER_SHARE ||
      'f23be727-b3e1-4510-9393-2527aa97a565',
  },
  unpaid: {
    id: process.env.E2E_UNPAID_CAREGIVER_ID || '6a9ae5ab6354b188fa2b6b33',
    name: process.env.E2E_UNPAID_CAREGIVER_NAME || 'Dana Whitfield',
    email: process.env.E2E_UNPAID_CAREGIVER_EMAIL || 'wevoro.care.dana@gmail.com',
    shareId:
      process.env.E2E_UNPAID_CAREGIVER_SHARE ||
      '6a94de62-beb9-4d25-85c4-6226ab39249e',
  },
};

/**
 * The caregiver the full-workflow run follows from end to end.
 *
 * One of the QA accounts created for testing, with a real password of its own
 * and a share link, so the whole journey is about one person: she signs in,
 * adds a credential, shares her link, and an agency arrives through it.
 */
export const JOURNEY = {
  email: process.env.E2E_JOURNEY_EMAIL || 'qa.olivia.bennett@wevoro-test.com',
  password: process.env.E2E_JOURNEY_PASSWORD || 'Wevoro@2026',
  name: process.env.E2E_JOURNEY_NAME || 'Olivia Bennett',
  // SCRUM-133: her link is locked (credentials in review), so it no longer
  // resolves to an id — the steps that need her id read it from here.
  id: process.env.E2E_JOURNEY_ID || '6aa7f8be491b34e9e49d070c',
  shareId:
    process.env.E2E_JOURNEY_SHARE || '5acbbe7e-31d8-4a87-aa12-83f6665a9689',
};

type Source = 'pro' | 'partner' | 'admin';

/**
 * Sign in as any account, given its own email and password.
 *
 * `signIn` below covers the accounts the suite carries by name; this is the
 * open version, for the journey caregiver and anyone added later.
 */
export async function signInAs(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
  password: string,
  source: Source = 'pro'
): Promise<void> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email, password, source },
  });
  expect(
    response.ok(),
    `login failed for ${email}: ${response.status()}`
  ).toBeTruthy();

  const { data } = await response.json();
  await setSession(context, data.accessToken, data.refreshToken);
}

/** Drop a session into the browser as the same cookies the app sets itself. */
async function setSession(
  context: BrowserContext,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const domain = new URL(process.env.E2E_BASE_URL || 'https://qa.wevoro.com')
    .hostname;
  const secure = domain !== 'localhost';

  await context.addCookies([
    { name: 'accessToken', value: accessToken, domain, path: '/', secure },
    { name: 'refreshToken', value: refreshToken, domain, path: '/', secure },
  ]);
}

/**
 * Resolve a share link to the caregiver behind it.
 *
 * This is the same public lookup the /p/[shareId] page makes, so the tests can
 * follow a caregiver by their link without an id hard-coded anywhere.
 */
export async function caregiverFromShare(
  request: APIRequestContext,
  shareId: string
): Promise<{ id: string; name: string }> {
  const response = await request.get(`${API_URL}/user/share/${shareId}`);
  expect(
    response.ok(),
    `share link ${shareId} did not resolve: ${response.status()}`
  ).toBeTruthy();

  const { data } = await response.json();
  const id = String(data?._id || data?.id || '');
  expect(id, 'the share link must resolve to a caregiver id').toBeTruthy();

  return {
    id,
    name: [data?.firstName, data?.lastName].filter(Boolean).join(' ').trim(),
  };
}

/**
 * Sign a role in without driving the login form.
 *
 * The login screen has its own test (01-login). Everywhere else, going through
 * it again would only make the run slower and turn one broken login into a
 * whole red suite, so the session is fetched from the API and dropped into the
 * browser as the same cookies the app sets itself.
 */
export async function signIn(
  context: BrowserContext,
  request: APIRequestContext,
  role: keyof typeof ACCOUNTS,
  source: Source = role === 'agency' ? 'partner' : 'pro'
): Promise<void> {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: { email: ACCOUNTS[role], password: PASSWORD, source },
  });
  expect(
    response.ok(),
    `login failed for ${ACCOUNTS[role]}: ${response.status()}`
  ).toBeTruthy();

  const { data } = await response.json();
  const domain = new URL(process.env.E2E_BASE_URL || 'https://qa.wevoro.com')
    .hostname;
  const secure = domain !== 'localhost';

  await context.addCookies([
    { name: 'accessToken', value: data.accessToken, domain, path: '/', secure },
    { name: 'refreshToken', value: data.refreshToken, domain, path: '/', secure },
  ]);
}

/** Ask the API whether the agency already owns a caregiver's packet. */
export async function packetStatus(
  request: APIRequestContext,
  caregiverId: string
): Promise<{ paid: boolean; priceCents: number }> {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: ACCOUNTS.agency, password: PASSWORD, source: 'partner' },
  });
  const token = (await login.json()).data.accessToken;
  const response = await request.get(`${API_URL}/payment/packet/${caregiverId}`, {
    headers: { Authorization: token },
  });
  const { data } = await response.json();
  return { paid: !!data?.paid, priceCents: data?.priceCents };
}

/**
 * SCRUM-141: payment waits on the caregiver's response. Put a pair into the
 * "responded, not yet paid" state the payment tests need: the agency onboards
 * the caregiver, and the caregiver responds. Both steps are idempotent, so a
 * pair that is already there is left alone.
 *
 * Only for a caregiver whose agency has no signing documents for their role —
 * with documents, responding also means drawing a signature, which only the
 * browser can do.
 */
export async function ensureResponded(
  request: APIRequestContext,
  caregiver: { id: string; email: string }
): Promise<void> {
  const agencyLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: ACCOUNTS.agency, password: PASSWORD, source: 'partner' },
  });
  const agencyToken = (await agencyLogin.json()).data.accessToken;
  const onboard = await request.post(`${API_URL}/offer/onboard/${caregiver.id}`, {
    headers: { Authorization: agencyToken },
  });
  const state = (await onboard.json())?.data?.state;
  if (state === 'submitted') return;

  const caregiverLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: caregiver.email, password: PASSWORD, source: 'pro' },
  });
  const caregiverToken = (await caregiverLogin.json()).data.accessToken;
  const offers = await request.get(`${API_URL}/offer`, {
    headers: { Authorization: caregiverToken },
  });
  const agencyId = JSON.parse(
    Buffer.from(agencyToken.split('.')[1], 'base64').toString()
  )._id;
  const offer = ((await offers.json())?.data ?? []).find(
    (o: any) => String(o?.partner?._id) === String(agencyId) && o.status !== 'rejected'
  );
  expect(offer, 'the onboard request must reach the caregiver').toBeTruthy();
  const respond = await request.post(`${API_URL}/offer/pro-respond/${offer._id}`, {
    headers: { Authorization: caregiverToken },
    multipart: { statusUpdates: '[]' },
  });
  expect(respond.ok(), `respond failed: ${respond.status()}`).toBeTruthy();
}
