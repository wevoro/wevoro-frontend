import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from './utils/isAuthenticated';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken');
  const isAuthenticatedUser: any = await isAuthenticated(
    token?.value as string
  );

  // console.log('🚀 ~ middleware ~ isAuthenticatedUser:', isAuthenticatedUser);
  // Define all protected routes with patterns
  const protectedRoutes = [
    /^\/pro\/onboard\/(personal-info|professional-info|document-upload|completed)$/,
    /^\/pro\/(profile|offers|jobs|notifications|settings)$/,
    /^\/partner\/(profile|pros|offers|notifications|settings)$/,
    /^\/partner\/pros\/\d+$/, // Matches /partner/pros/:id (numeric)
    /^\/admin$/,
    /^\/admin\/pros$/,
    /^\/admin\/partners$/,
  ];

  // Check if the current path matches any of the protected routes
  const isProtected = protectedRoutes.some((route) =>
    route.test(req.nextUrl.pathname)
  );

  // Check if the current path is an admin route
  const isAdminRoute =
    req.nextUrl.pathname.startsWith('/admin') &&
    !req.nextUrl.pathname.startsWith('/admin/login');

  // Admin panel admits both admin and super_admin.
  const adminRoles = ['admin', 'super_admin'];
  const isAdminUser = adminRoles.includes(isAuthenticatedUser.role);

  // Super Admin panel: /admin/admins is restricted to super_admin only.
  const isSuperAdminRoute = req.nextUrl.pathname.startsWith('/admin/admins');

  // Redirect unauthenticated users or non-admin users trying to access protected routes
  if (
    (!isAuthenticatedUser.email && isProtected) ||
    (isAdminRoute && !isAdminUser)
  ) {
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // SCRUM-108: a caregiver clicking the CTA in a credential alert email is
    // signed out, so they used to land on the public marketing homepage with
    // no prompt and no way back to the credential. Send them to the right
    // login page instead, carrying where they were headed so we can return
    // them there once they are in.
    const intended = req.nextUrl.pathname + req.nextUrl.search;
    const loginPath = req.nextUrl.pathname.startsWith('/partner')
      ? '/partner/login'
      : '/pro/login';
    const to = new URL(loginPath, req.url);
    to.searchParams.set('redirect', intended);
    return NextResponse.redirect(to);
  }

  // A non-super-admin (plain admin) trying to open the admins management page
  // is bounced to the admin dashboard.
  if (isSuperAdminRoute && isAuthenticatedUser.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes under `/pro` and `/partner`
  matcher: ['/pro/:path*', '/partner/:path*', '/admin/:path*'],
};
