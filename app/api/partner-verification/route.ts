import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const referer = req.headers.get('referer');
    let env = 'prod';
    if (referer) {
      const parsedUrl = new URL(referer);
      env = parsedUrl.searchParams.get('env') || 'prod';
    }

    const formData = await req.formData();
    // Assuming backend endpoint is /partner-verification/verify
    const apiUrl =
      env === 'qa'
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/partner-verification/verify`
        : `/partner-verification/verify`;
    console.log('🚀 ~ POST ~ apiUrl:', apiUrl);

    const response = await api.post(apiUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Verification submitted successfully',
        data: response.data,
      });
    }
  } catch (error: any) {
    console.error(
      'Partner verification failed:',
      error?.response?.data || error,
    );
    const statusCode = error?.response?.status || 500;
    return NextResponse.json(
      {
        status: statusCode,
        message: error?.response?.data?.message || 'Verification failed',
      },
      { status: statusCode },
    );
  }
}
