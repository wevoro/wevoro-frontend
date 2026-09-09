import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin oversight of one agency's e-signature activity: the documents it
 * uploaded for caregivers to sign, and the signed copies that came back.
 *
 * The backend's real status is propagated rather than wrapped in a 200 — a
 * proxy that reports failure as success has silently broken a feature in this
 * codebase more than once.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const response = await api.get(`/esign/admin/agency/${params.agencyId}`);
    return NextResponse.json({ status: 200, data: response.data?.data });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      {
        status,
        message:
          error?.response?.data?.message || 'Could not load the agency documents',
      },
      { status }
    );
  }
}
