import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const response = await api.patch(`/esign/documents/${params.id}/replace`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Replace failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
