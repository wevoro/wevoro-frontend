import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.get(`/esign/offer/${params.id}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Failed to load signing context' },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.post(`/esign/offer/${params.id}/start`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Failed to start signing' },
      { status: error?.response?.status || 500 }
    );
  }
}
