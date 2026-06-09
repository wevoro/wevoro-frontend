import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

// SCRUM-67: Get bulk download package
export async function GET(
  request: NextRequest,
  { params }: { params: { caregiverUserId: string } }
) {
  try {
    const response = await api.get(`/document/download-package/${params.caregiverUserId}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.response?.data?.message || 'Failed to get download package' },
      { status: error?.response?.status || 500 }
    );
  }
}
