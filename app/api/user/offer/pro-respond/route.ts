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

    // The HTTP status has to carry the failure too. These used to return 200
    // with the error hidden in the body, so the client read every failure as a
    // success.
    return NextResponse.json(
      {
        status: response.status,
        message: response.data?.message || 'Failed to submit response',
      },
      { status: response.status || 500 }
    );
  } catch (error: any) {
    console.error('Pro respond failed:', error.response);
    const status = error.response?.status || 500;
    return NextResponse.json(
      {
        status,
        message: error.response?.data?.message || 'Failed to submit response',
      },
      { status }
    );
  }
}
