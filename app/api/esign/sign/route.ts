import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { packetId, itemId } = await req.json();
    const response = await api.post(`/esign/packet/${packetId}/sign/${itemId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Signing failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
