import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const response = await api.post('/shift', data);
    return NextResponse.json({
      status: 200,
      message: 'Shift created successfully!',
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to create shift',
    });
  }
}

export async function GET() {
  try {
    const response = await api.get('/shift');
    return NextResponse.json({
      status: 200,
      data: response.data.data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: error?.response?.status || 500,
      message: error?.response?.data?.message || 'Failed to fetch shifts',
    });
  }
}
