import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const response = await api.post(`/shift/${params.id}/assign`, data);
    return NextResponse.json({
      status: 200,
      message: 'Caregiver assigned successfully!',
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to assign caregiver',
    });
  }
}
