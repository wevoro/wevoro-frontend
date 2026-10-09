import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-142/143: the stored WeVoro receipt, rendered as the page itself so
 * "View receipt" opens exactly what was emailed. For the paying agency or an
 * admin; the backend checks which.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const response = await api.get(`/payment/receipt/${params.transactionId}`);
    const html: string = response.data?.data?.html || '';
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data?.message || 'This receipt could not be loaded.';
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Receipt</title><body style="font-family:Arial,sans-serif;padding:40px;color:#1C1C1C"><h1 style="font-size:20px">Receipt unavailable</h1><p>${String(
        message
      ).replace(/</g, '&lt;')}</p></body>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}
