import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119 (QA only): drive a simulated payment to success or failure.
 *
 * The backend refuses this outright once Stripe is configured, so this route
 * cannot be used to bypass a real charge — it simply stops working the moment
 * real credentials exist.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const body = await request.json();
    const response = await api.post(`/payment/simulate/${params.transactionId}`, body);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Simulation failed' },
      { status }
    );
  }
}
