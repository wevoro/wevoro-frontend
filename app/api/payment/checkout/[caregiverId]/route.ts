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
  request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    // Tell the backend which site the agency is on, so Stripe sends them back
    // here. QA and production share one backend, so it cannot know on its own.
    const returnOrigin = request.headers.get('origin') || request.nextUrl.origin;
    const response = await api.post(`/payment/checkout/${params.caregiverId}`, {
      returnOrigin,
    });
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not start checkout' },
      { status }
    );
  }
}
