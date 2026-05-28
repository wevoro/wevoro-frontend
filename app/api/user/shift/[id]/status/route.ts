import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const response = await api.patch(`/shift/${params.id}/status`, data);
    return NextResponse.json({
      status: 200,
      message: 'Shift status updated!',
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to update status',
    });
  }
}
