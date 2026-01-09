import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  try {
    // Get documentId from URL search params
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { status: 400, message: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Determine environment from referer
    const referer = req.headers.get('referer');
    let env = 'prod';
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get('env') || 'prod';
    }

    // Use QA API URL if env is qa, otherwise use default
    const apiUrl =
      env === 'qa'
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/document/${documentId}`
        : `/document/${documentId}`;

    const response = await api.delete(apiUrl);

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Document deleted successfully',
        data: response.data.data,
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data.message || 'Delete failed',
    });
  } catch (error: any) {
    console.error(
      'Document delete failed:',
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Document delete failed',
      },
      { status: error.response?.status || 500 }
    );
  }
}
