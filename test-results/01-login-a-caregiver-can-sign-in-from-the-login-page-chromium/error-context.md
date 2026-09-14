# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-login.spec.ts >> a caregiver can sign in from the login page
- Location: e2e\01-login.spec.ts:8:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/pro\/(profile|onboard)/
Received string:  "https://qa.wevoro.com/pro/login"
Timeout: 90000ms

Call log:
  - Expect "toHaveURL" with timeout 90000ms
    179 × locator resolved to <html lang="en">…</html>
        - unexpected value "https://qa.wevoro.com/pro/login"

```

```yaml
- main:
  - link "Wevoro":
    - /url: /
  - paragraph: Share your Professional Profile Link with Employeers
  - paragraph: Unlock your next opportunity in healthcare. Sign in and apply for job. It's fast, free, and puts you in control of your career journey.
  - heading "Welcome back" [level=1]
  - paragraph: Log In to Your Account
  - text: Email
  - textbox "Enter your email...": riadhossinr4@gmail.com
  - text: Password
  - textbox "Enter your password...": admin1234
  - button:
    - img
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot password?":
    - /url: /pro/forgot-password
  - button "Login"
  - text: OR
  - button "Login with Google":
    - img
    - text: Login with Google
  - paragraph:
    - text: New to Wevoro?
    - link "Create an account":
      - /url: /pro/signup
- region "Notifications alt+T"
- region "Notifications (F8)":
  - list
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { ACCOUNTS, PASSWORD } from './fixtures/wevoro';
  3  | 
  4  | /**
  5  |  * The login form itself. Every other test takes its session from the API, so
  6  |  * this is the one place the real screen is driven end to end.
  7  |  */
  8  | test('a caregiver can sign in from the login page', async ({ page }) => {
  9  |   await page.goto('/pro/login');
  10 | 
  11 |   await page.locator('input[type=email], input[name=email]').first().fill(ACCOUNTS.caregiver);
  12 |   await page.locator('input[type=password]').first().fill(PASSWORD);
  13 |   await page.getByRole('button', { name: /^(login|sign in)$/i }).first().click();
  14 | 
> 15 |   await expect(page).toHaveURL(/\/pro\/(profile|onboard)/, { timeout: 90_000 });
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  16 |   await expect(page.getByText(/credentials status|personal information/i).first()).toBeVisible();
  17 | });
  18 | 
  19 | test('a wrong password is refused', async ({ page }) => {
  20 |   await page.goto('/pro/login');
  21 | 
  22 |   await page.locator('input[type=email], input[name=email]').first().fill(ACCOUNTS.caregiver);
  23 |   await page.locator('input[type=password]').first().fill('definitely-not-the-password');
  24 |   await page.getByRole('button', { name: /^(login|sign in)$/i }).first().click();
  25 | 
  26 |   await page.waitForTimeout(6000);
  27 |   await expect(page).toHaveURL(/\/pro\/login/);
  28 | });
  29 | 
```