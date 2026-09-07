import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119: reconcile a transaction against Stripe.
 *
 * The backend asks Stripe directly, so this is not the browser claiming it
 * paid. It covers the window before the webhook lands and the case where a
 * webhook is never delivered.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const response = await api.post(`/payment/confirm/${params.transactionId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not confirm payment' },
      { status }
    );
  }
}
