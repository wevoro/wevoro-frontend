import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await api.get('/esign/documents');
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Failed to load documents' },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const response = await api.post('/esign/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    return NextResponse.json(
      { status: error?.response?.status || 500, message: error?.response?.data?.message || 'Upload failed' },
      { status: error?.response?.status || 500 }
    );
  }
}
