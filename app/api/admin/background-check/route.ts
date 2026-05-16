import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const { userId, backgroundCheckStatus } = await req.json();

    if (!userId || !backgroundCheckStatus) {
      return NextResponse.json(
        { status: 400, message: 'userId and backgroundCheckStatus are required' },
        { status: 400 }
      );
    }

    const response = await api.patch(`/user/update/${userId}`, {
      backgroundCheckStatus,
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Background check updated successfully',
        data: response.data.data,
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data.message || 'Update failed',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Background check update failed',
      },
      { status: error.response?.status || 500 }
    );
  }
}
