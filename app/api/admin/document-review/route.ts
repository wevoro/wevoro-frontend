import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const { documentId, reviewStatus } = await req.json();

    if (!documentId || !reviewStatus) {
      return NextResponse.json(
        { status: 400, message: 'documentId and reviewStatus are required' },
        { status: 400 }
      );
    }

    const response = await api.patch(`/document/${documentId}/review`, {
      reviewStatus,
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: response.data.message || 'Document reviewed successfully',
        data: response.data.data,
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data.message || 'Review failed',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Document review failed',
      },
      { status: error.response?.status || 500 }
    );
  }
}
