import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119: what a packet costs and whether this agency already owns it.
 * Free to call — nothing here releases a file.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.get(`/payment/packet/${params.caregiverId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Failed to load packet status' },
      { status }
    );
  }
}
