import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

// SCRUM-99: passwordless agency login — verify the emailed code and start a
// session. Mirrors the password /login route: sets accessToken + refreshToken
// httpOnly cookies so the browser is authenticated.
export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const response = await api.post(`/auth/verify-code`, { email, otp });

    if (response.status === 200) {
      const { accessToken, refreshToken, completionPercentage, agencyProfileComplete } =
        response.data?.data;

      // agencyProfileComplete has to be forwarded: it is the only signal that
      // the agency actually submitted the completion form. Without it the
      // client falls back to completionPercentage, which scores nine fields
      // the form never collects, so a completed agency scores 44% and is sent
      // back to the form on every login.
      const res = NextResponse.json({
        status: 200,
        message: 'Login successful',
        completionPercentage,
        agencyProfileComplete,
      });

      res.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      });
      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return res;
    }
  } catch (error: any) {
    console.error('Verify code failed:', error.response);
    return NextResponse.json({
      status: 500,
      message: error.response?.data?.message || 'Invalid or expired code',
    });
  }
}
