import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119: open (or resume) a purchase.
 *
 * The backend is idempotent — an already-paid packet comes back with
 * alreadyPaid and no client secret, and an unfinished attempt reuses its
 * existing PaymentIntent — so calling this twice never creates a second charge.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.post(`/payment/checkout/${params.caregiverId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not start checkout' },
      { status }
    );
  }
}
