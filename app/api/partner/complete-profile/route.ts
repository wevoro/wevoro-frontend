import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

// SCRUM-99 (Phase 2): passwordless agency submits the 4-field "Complete your
// agency account" form. Forwards to the backend, which saves the lookup fields
// and moves the account to Pending Verification (in-review). The accessToken
// cookie is attached server-side by the axios interceptor.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await api.patch('/user/complete-agency-profile', body);

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Agency account submitted for verification',
        data: response.data?.data,
      });
    }
    return NextResponse.json({
      status: 500,
      message: 'Could not submit your details',
    });
  } catch (error: any) {
    console.error('Complete agency profile failed:', error.response);
    return NextResponse.json({
      status: 500,
      message: error.response?.data?.message || 'Could not submit your details',
    });
  }
}
