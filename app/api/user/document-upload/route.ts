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
    const isPublic = bodyData.get('isPublic');
    const consent = bodyData.get('consent');
    // SCRUM-177: the version of the medical-consent wording the caregiver
    // ticked. Like `part` below, it only reaches the backend if it is copied
    // into the rebuilt form — without this the consent record has no version.
    const consentVersion = bodyData.get('consentVersion');
    const file = bodyData.get('file');
    const documentId = bodyData.get('documentId'); // For updates
    // SCRUM-165: which half of a PCA certificate this is. The form is rebuilt
    // field by field below, so anything not copied across never reaches the
    // backend — the sign-off would be stored as a second plain certificate.
    const part = bodyData.get('part');

    // Create new FormData to send to backend
    const formData = new FormData();
    formData.append('category', category as string);
    formData.append('documentType', documentType as string);
    formData.append('title', title as string);
    formData.append('isPublic', isPublic as string);
    formData.append('consent', consent as string);

    // Only append file if one was provided
    if (file && file instanceof File && file.size > 0) {
      formData.append('file', file);
    }

    // Append documentId if updating existing document
    if (documentId) {
      formData.append('documentId', documentId as string);
    }

    if (part) {
      formData.append('part', part as string);
    }

    if (consentVersion) {
      formData.append('consentVersion', consentVersion as string);
    }

    // Use QA API URL if env is qa, otherwise use default
    const apiUrl =
      env === 'qa'
        ? `${process.env.NEXT_PUBLIC_QA_API_URL}/document/upload`
        : '/document/upload';

    console.log('📤 [DocumentUpload] env:', env, '| apiUrl:', apiUrl);
    console.log('📤 [DocumentUpload] baseURL:', api.defaults.baseURL);
    console.log('📤 [DocumentUpload] file:', file instanceof File ? `${file.name} (${file.size} bytes)` : 'none');

    const response = await api.post(apiUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('📤 [DocumentUpload] Response status:', response.status);

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
      '❌ [DocumentUpload] FAILED:',
      JSON.stringify({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      }),
    );
    return NextResponse.json(
      {
        status: error.response?.status || 500,
        message: error.response?.data?.message || 'Document upload failed',
      },
      { status: error.response?.status || 500 },
    );
  }
}

