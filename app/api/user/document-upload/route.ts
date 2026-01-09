import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Determine environment from referer
    const referer = req.headers.get('referer');
    let env = 'prod';
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get('env') || 'prod';
    }

    const bodyData = await req.formData();

    // Extract fields from the form data
    const category = bodyData.get('category');
    const documentType = bodyData.get('documentType');
    const title = bodyData.get('title');
    const isProtected = bodyData.get('isProtected');
    const consent = bodyData.get('consent');
    const file = bodyData.get('file');

    if (!file) {
      return NextResponse.json(
        { status: 400, message: 'File is required' },
        { status: 400 }
      );
    }

    // Create new FormData to send to backend
    const formData = new FormData();
    formData.append('category', category as string);
    formData.append('documentType', documentType as string);
    formData.append('title', title as string);
    formData.append('isProtected', isProtected as string);
    formData.append('consent', consent as string);
    formData.append('file', file as File);

    // Use QA API URL if env is qa, otherwise use default
    const apiUrl =
      env === 'qa'
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/document/upload`
        : '/document/upload';

    const response = await api.post(apiUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Document uploaded successfully',
        data: response.data.data,
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data.message || 'Upload failed',
    });
  } catch (error: any) {
    console.error(
      'Document upload failed:',
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Document upload failed',
      },
      { status: error.response?.status || 500 }
    );
  }
}
