import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { packetId, itemId, signatureImage } = await req.json();
    // The hand-drawn signature has to travel with the request. Forwarding only
    // the ids left the backend with nothing to stamp, so it printed the
    // caregiver's name instead of their signature.
    const response = await api.post(`/esign/packet/${packetId}/sign/${itemId}`, {
      signatureImage,
    });
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Signing failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
