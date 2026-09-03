import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.patch(`/esign/documents/${params.id}/restore`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Restore failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
