import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/** SCRUM-141: the agency's Onboard button. Idempotent on the server. */
export async function POST(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.post(`/offer/onboard/${params.caregiverId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not onboard this caregiver' },
      { status }
    );
  }
}
