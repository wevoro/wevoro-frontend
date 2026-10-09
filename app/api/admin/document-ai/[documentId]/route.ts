import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

/**
 * Admin: have the AI read a credential and pre-fill the confirmation form.
 * Suggestion only — the backend writes nothing to reviewStatus.
 */
export async function POST(
  _req: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    if (!documentId) {
      return NextResponse.json(
        { status: 400, message: 'documentId is required' },
        { status: 400 }
      );
    }

    const response = await api.post(`/document/${documentId}/ai-extract`);

    return NextResponse.json({
      status: 200,
      message: response.data?.message || 'Document read',
      data: response.data?.data,
    });
  } catch (error: any) {
    // The admin can always type the fields by hand, so a failure here is a
    // message on the panel, never a blocked confirmation.
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message || 'The document could not be read automatically',
      },
      { status: error.response?.status || 500 }
    );
  }
}
