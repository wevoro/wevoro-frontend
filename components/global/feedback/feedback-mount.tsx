'use client';

import { useUserContext } from '@/lib/contexts';
import FloatingFeedback from './floating-feedback';

/**
 * SCRUM-98 / SCRUM-200 — the one rule for who gets the Feedback button.
 *
 * SCRUM-98 mounted it in app/(private)/layout.tsx, the common ancestor of every
 * logged-in caregiver/agency screen. Privacy Policy and Terms of Use are not
 * under it: they live in app/(homelayout), the public marketing group, because
 * a logged-out visitor has to be able to read them. So the button vanished the
 * moment a signed-in user opened either page — SCRUM-200.
 *
 * Those two pages are server components, so they cannot apply the rule
 * themselves; it lives here instead of being written out twice, so the two
 * surfaces can never drift apart.
 *
 * The rule is SCRUM-98's, unchanged: allowlist pro/partner rather than relying
 * on the component's own `role === 'admin'` check, which keeps the button off
 * super_admin screens and — the part that matters on a public page — off every
 * logged-out visit, where `user` is null.
 */
const FeedbackMount = () => {
  const { user, isUserLoading } = useUserContext();
  if (isUserLoading) return null;

  const showFeedback = user?.role === 'pro' || user?.role === 'partner';
  return showFeedback ? <FloatingFeedback /> : null;
};

export default FeedbackMount;
