import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

// SCRUM-66: Update GCHEXS status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await api.patch('/user/gchexs', body);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.response?.data?.message || 'Failed to update GCHEXS status' },
      { status: error?.response?.status || 500 }
    );
  }
}
