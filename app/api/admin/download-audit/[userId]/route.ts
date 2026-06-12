import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const response = await api.get(`/document/download-audit/${userId}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Download audit fetch error:', error?.response?.data || error);
    return NextResponse.json(
      { data: [], message: 'No audit logs found' },
      { status: 200 }
    );
  }
}
