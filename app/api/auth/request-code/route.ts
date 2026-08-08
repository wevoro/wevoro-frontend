import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

// SCRUM-99: passwordless agency login — ask the backend to email a login code.
export async function POST(req: Request) {
  try {
    const { email, role, sourceShareId } = await req.json();

    const response = await api.post(`/auth/request-code`, {
      email,
      role,
      sourceShareId,
    });

    if (response.status === 200) {
      const { otpExpiry, isNewUser } = response.data?.data || {};
      return NextResponse.json({
        status: 200,
        message: 'Code sent',
        otpExpiry,
        isNewUser,
      });
    }
  } catch (error: any) {
    console.error('Request code failed:', error.response);
    return NextResponse.json({
      status: 500,
      message: error.response?.data?.message || 'Failed to send code',
    });
  }
}
