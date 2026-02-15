import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const response = await api.post(`/offer`, data);
    console.log('🚀 ~ POST ~ response:', response?.data?.data?.documentsNeeded);

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: 'Offer sent successfully!',
      });
      return res;
    }
  } catch (error: any) {
    console.error('Offer send failed:', error.response.status);
    return NextResponse.json({
      status: error.response.status || 500,
      message: error.response.data.message,
    });
  }
}
