import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

/**
 * Admin: how much of the credential review the AI is allowed to do.
 * Two switches — assist (reads and pre-fills) and automation (decides).
 */
export async function GET() {
  try {
    const response = await api.get('/document/ai-settings');

    return NextResponse.json({
      status: 200,
      message: 'AI settings retrieved',
      data: response.data?.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Could not load the AI settings',
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    // Only the two switches are forwarded. Anything else the client sends is
    // dropped here rather than relied on the backend to ignore.
    const response = await api.patch('/document/ai-settings', {
      assistEnabled: body?.assistEnabled,
      automationEnabled: body?.automationEnabled,
    });

    return NextResponse.json({
      status: 200,
      message: response.data?.message || 'AI settings updated',
      data: response.data?.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Could not save the AI settings',
      },
      { status: error.response?.status || 500 }
    );
  }
}
