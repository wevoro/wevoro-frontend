import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * The backend's JSON error, read out of a response that was requested as an
 * arraybuffer. axios hands back the raw bytes for an error too, so reading
 * `.message` off them always came back empty and the agency saw the generic
 * fallback instead of the reason (e.g. that nothing is confirmed yet).
 */
const errorMessage = (data: unknown): string | undefined => {
  try {
    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      return JSON.parse(new TextDecoder().decode(bytes))?.message;
    }
    return (data as any)?.message;
  } catch {
    return undefined;
  }
};

/**
 * SCRUM-67 Scenario 2 — the credential package, as one zip.
 *
 * Proxied so the browser downloads from our own origin. The old client-side
 * loop clicked one link per file straight at the CDN, which a browser blocks
 * after the first, so an agency was promised several documents and received
 * one.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { caregiverId: string } }
) {
  try {
    const response = await api.get(
      `/document/download-package-zip/${params.caregiverId}`,
      { responseType: 'arraybuffer' }
    );

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition':
          response.headers['content-disposition'] ||
          'attachment; filename="credential-package.zip"',
        // SCRUM-67: what is really inside, signed documents included — the
        // toast reads these rather than counting the credential list.
        'X-Document-Count': response.headers['x-document-count'] || '',
        'X-Credential-Count': response.headers['x-credential-count'] || '',
        'X-Signed-Count': response.headers['x-signed-count'] || '',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      {
        status,
        message:
          errorMessage(error?.response?.data) ||
          'Could not build the credential package',
      },
      { status }
    );
  }
}
