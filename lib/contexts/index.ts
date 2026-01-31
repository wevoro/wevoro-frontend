// Domain Contexts - Re-exports for easy importing
// Usage: import { useUserContext, useAuthContext } from '@/lib/contexts';

// User Context - Core user data and profile completion status
export { UserProvider, useUserContext } from './user-context';

// Auth Context - Authentication handlers (login, signup, password reset, etc.)
export { AuthProvider, useAuthContext } from './auth-context';

// UI Context - Modal states and UI toggles
export { UIProvider, useUIContext } from './ui-context';

// Admin Context - Admin-only data (users, pros, partners, feedbacks)
export { AdminProvider, useAdminContext } from './admin-context';

// Onboard Context - Onboarding form refs and handlers
export { OnboardProvider, useOnboardContext } from './onboard-context';

// Auth Status Context - Authentication status (isAuthenticated, expiresAt)
// Also exports CookiesProvider/useCookiesContext as aliases for backward compatibility
export {
  AuthStatusProvider,
  useAuthStatusContext,
  CookiesProvider,
  useCookiesContext,
} from './cookies-context';
