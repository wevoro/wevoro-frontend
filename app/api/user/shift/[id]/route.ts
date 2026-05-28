import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.get(`/shift/${params.id}`);
    return NextResponse.json({
      status: 200,
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to fetch shift',
    });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const response = await api.patch(`/shift/${params.id}`, data);
    return NextResponse.json({
      status: 200,
      message: 'Shift updated successfully!',
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to update shift',
    });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const response = await api.delete(`/shift/${params.id}`);
    return NextResponse.json({
      status: 200,
      message: 'Shift removed successfully!',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to delete shift',
    });
  }
}
