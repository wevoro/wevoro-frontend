import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119: the file list for the documents modal.
 *
 * Free to view. The backend returns every submitted file with its type and
 * size, but withholds the url until the packet is paid for — so the agency can
 * see exactly what they are buying without being able to take it.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.get(`/document/packet-manifest/${params.caregiverId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Failed to load documents' },
      { status }
    );
  }
}
