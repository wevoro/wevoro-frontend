import { redirect } from 'next/navigation';

// SCRUM-99 "New Login Method": agencies are passwordless (email + emailed code).
// The old email+password login is retired — send everyone to the passwordless
// two-column "Welcome back" sign-in.
export const dynamic = 'force-dynamic';

export default function PartnerLoginPage() {
  redirect('/partner/access?mode=signin');
}
