import api from '@/lib/axiosInterceptor';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      documentId,
      reviewStatus,
      credentialIdNumber,
      credentialIssueDate,
      credentialExpirationDate,
      issuingOrganization,
      rejectionReason,
      // SCRUM-109
      rejectionReasonCode,
      requestReplacement,
      aiSuggestedReason,
      adminAgreedWithAi,
      hasNoExpiration,
    } = body;

    if (!documentId || !reviewStatus) {
      return NextResponse.json(
        { status: 400, message: 'documentId and reviewStatus are required' },
        { status: 400 }
      );
    }

    const response = await api.patch(`/document/${documentId}/review`, {
      reviewStatus,
      credentialIdNumber,
      credentialIssueDate,
      credentialExpirationDate,
      issuingOrganization,
      rejectionReason,
      rejectionReasonCode,
      requestReplacement,
      aiSuggestedReason,
      adminAgreedWithAi,
      hasNoExpiration,
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
