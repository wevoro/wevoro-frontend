import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.get(`/esign/documents/${params.id}/pending-copies`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Lookup failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
