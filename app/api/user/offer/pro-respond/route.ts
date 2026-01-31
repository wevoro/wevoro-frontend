import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const bodyData = await req.formData();
    const entries = Object.fromEntries(bodyData.entries());

    const { offerId, statusUpdates, ...documents } = entries;

    const formData = new FormData();

    // Add files with correct names (docId as originalname)
    const filesArray = Object.entries(documents);
    for (const [docId, file] of filesArray) {
      if (file instanceof File) {
        formData.append('documents', file as File, docId);
      }
    }

    // Add status updates as JSON string
    if (statusUpdates) {
      formData.append('statusUpdates', statusUpdates as string);
    }

    const response = await api.post(`/offer/pro-respond/${offerId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.status === 200) {
      return NextResponse.json({
        status: 200,
        message: 'Response submitted successfully',
        data: response.data?.data,
      });
    }

    return NextResponse.json({
      status: response.status,
      message: response.data?.message || 'Failed to submit response',
    });
  } catch (error: any) {
    console.error('Pro respond failed:', error.response);
    return NextResponse.json({
      status: 500,
      message: error.response?.data?.message || 'Failed to submit response',
    });
  }
}
