import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.delete(`/esign/documents/${params.id}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Remove failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
