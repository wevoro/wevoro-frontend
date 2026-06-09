import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

// SCRUM-67: Download individual document
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const response = await api.get(`/document/download/${params.documentId}`);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.response?.data?.message || 'Failed to download document' },
      { status: error?.response?.status || 500 }
    );
  }
}
