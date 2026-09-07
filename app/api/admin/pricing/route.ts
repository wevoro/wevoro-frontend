import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-113: founder-only pricing administration.
 *
 * Both handlers forward the whole payload and propagate the backend's real HTTP
 * status. A proxy that rebuilds the body field-by-field, or that wraps a failure
 * in a 200, has silently broken a feature in this codebase four times — so
 * neither is done here.
 */
export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.searchParams.toString();
    const response = await api.get(`/pricing/admin/overview${qs ? `?${qs}` : ''}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Failed to load pricing' },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await api.patch('/pricing/admin/price', body);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Failed to update the price' },
      { status }
    );
  }
}
