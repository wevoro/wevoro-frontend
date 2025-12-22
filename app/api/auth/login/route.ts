import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, source } = await req.json();

    const response = await api.post(`/auth/login`, {
      email,
      password,
      source,
    });

    if (response.status === 200) {
      const { accessToken, refreshToken, completionPercentage } =
        response.data?.data;
      console.log('response.data?.data', response.data?.data);
      const res = NextResponse.json({
        status: 200,
        message: 'Login successful',
        completionPercentage,
      });

      res.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 5 minutes in seconds (for testing)
        path: '/',
      });
      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // maxAge: 3 * 60, // 10 minutes in seconds (for testing)
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return res;
    }
  } catch (error: any) {
    console.error('Login failed:', error.response);
    return NextResponse.json({
      status: 500,
      message: error.response.data.message,
    });
  }
}
