import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await api.get('/esign/my-packets');
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || 'Failed to load signing packets',
      },
      { status: error?.response?.status || 500 }
    );
  }
}
