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

    const bodyData = await req.formData();
    const entries = Object.fromEntries(bodyData.entries());

    const { data, id, ...certificationFiles } = entries;

    const formData = new FormData();

    // Forward certificate files with their original names (certification_0, certification_1, etc.)
    // This allows the backend to match files to certifications by index
    for (const [key, file] of Object.entries(certificationFiles)) {
      if (file instanceof File) {
        formData.append('certifications', file, key);
      }
    }

    formData.append('data', data as string);

    const queryId = id ? `?id=${id}` : '';

    console.log('🚀 ~ POST ~ queryId data:', formData);

    const apiUrl =
      env === 'qa'
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/user/professional-information${queryId}`
        : `/user/professional-information${queryId}`;

    const response = await api.patch(apiUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // console.log(
    //   "🚀 ~ POST ~ response professional-information:",
    //   response.data
    // );

    if (response.status === 200) {
      const res = NextResponse.json({
        status: 200,
        message: 'Personal information updated successfully',
        data: response.data,
      });
      return res;
    }
  } catch (error: any) {
    console.error(
      'Professional information update failed:',
      error.response.data,
    );
    return NextResponse.json({
      status: 500,
      message: error.response.data.message,
    });
  }
}
