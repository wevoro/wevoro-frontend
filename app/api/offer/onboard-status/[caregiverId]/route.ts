import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-141: where this agency stands with a caregiver — not onboarded,
 * waiting on the caregiver's response, or submitted (payment unlocked).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.get(`/offer/onboard-status/${params.caregiverId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not load onboarding status' },
      { status }
    );
  }
}
