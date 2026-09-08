import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { packetId, itemId, signatureImage } = await req.json();
    // The hand-drawn signature has to travel with the request. Forwarding only
    // the ids left the backend with nothing to stamp, so it printed the
    // caregiver's name instead of their signature.
    //
    // The caregiver's IP and browser have to travel too. This is a
    // server-to-server hop, so the backend was reading THIS function's headers
    // and printing its egress IP and "axios/1.10.0" onto the Certificate of
    // Completion as the person who signed — a confident, wrong value on the
    // one document that is meant to be evidence.
    const forwardedFor =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const response = await api.post(
      `/esign/packet/${packetId}/sign/${itemId}`,
      { signatureImage },
      {
        headers: {
          ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
          ...(userAgent ? { 'user-agent': userAgent } : {}),
        },
      }
    );
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Signing failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
