import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

// Always read fresh: this list changes the moment an agency clicks Onboard.
export const dynamic = 'force-dynamic';

/**
 * The agency's Onboarding list (Awaiting signature / Completed).
 *
 * It used to be loaded through a Next server action. Next runs server actions
 * one at a time per page, and a navigation drops the one in flight, so after
 * clicking Onboard and opening the Onboarding page the fresh list waited
 * behind the page's other loads — or was dropped — and only arrived with the
 * next 20-second poll. A plain GET route starts at once and runs in parallel.
 */
export async function GET() {
  try {
    const response = await api.get(`/credentialing/agency-engagements`);
    return NextResponse.json({ status: 200, data: response.data?.data ?? null });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      { status, message: error?.response?.data?.message || 'Could not load onboarding list' },
      { status }
    );
  }
}
