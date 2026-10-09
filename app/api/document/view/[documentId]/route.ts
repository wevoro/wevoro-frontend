import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/** SCRUM-119: the file types this free view lets the browser render inline. */
const INLINE_VIEW_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * SCRUM-130 — the free credential view.
 *
 * Viewing a credential costs nothing; only downloading the packet is paid for.
 * The credential read paths deliberately withhold `url` because the Bunny CDN
 * links are unsigned and world-readable, so handing one to the browser would
 * give away the very file the $49.99 download sells.
 *
 * This route closes that gap: the card links here instead, same-origin, and the
 * bytes come back through the server with the storage location never exposed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    // How the browser is asking for this. 'iframe' is the in-app preview;
    // 'document' means someone put the address in a tab of its own, where the
    // browser's PDF viewer supplies a download button — which would turn the
    // free view into a free download. The backend decides what to do with it,
    // because only it knows whether this agency has paid; a server-side axios
    // call carries none of the browser's own fetch metadata, so it is forwarded
    // explicitly here.
    const dest = request.headers.get('sec-fetch-dest') || '';

    const response = await api.get(`/document/view/${params.documentId}`, {
      responseType: 'arraybuffer',
      headers: { 'x-wevoro-fetch-dest': dest },
    });

    // SCRUM-119: this is served inline from our own origin, where the agency's
    // session cookie lives, so only a type that cannot run script is passed
    // through (the backend already narrows it; this keeps the rule here too).
    // An SVG or HTML upload goes out as opaque bytes, never as markup.
    const upstreamType = String(response.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const contentType = INLINE_VIEW_TYPES.includes(upstreamType)
      ? upstreamType
      : 'application/octet-stream';

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition':
          response.headers['content-disposition'] || 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        // No script and no same-origin for whatever the file holds. Left off a
        // PDF only because Chrome's PDF viewer will not load in a sandboxed
        // document, and a PDF cannot run script on our origin.
        ...(contentType === 'application/pdf'
          ? {}
          : { 'Content-Security-Policy': 'sandbox' }),
      },
    });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      {
        status,
        message:
          error?.response?.data?.message || 'Could not open this document',
      },
      { status }
    );
  }
}
