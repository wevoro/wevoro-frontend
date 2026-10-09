import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-67 — one document, saved rather than opened.
 *
 * The design gives every row in the unlocked packet its own download arrow.
 * That arrow used to point straight at the Bunny CDN, which fails twice over:
 * `download` is ignored cross-origin, so the file opened in a tab instead of
 * saving, and going direct skipped the backend entirely — no entitlement check,
 * no audit row, and no first-download notification to the caregiver.
 *
 * So the request goes through the backend's own /document/download/:id, which
 * refuses with 402 when the packet has not been bought and writes the audit
 * row, and the bytes are then re-emitted from our origin as an attachment.
 * Deliberately NOT /document/view/:id — that one is the free read and is served
 * inline on purpose.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    // Entitlement, audit log and caregiver notification all happen here.
    const meta = await api.get(`/document/download/${params.documentId}`);
    const data = meta.data?.data ?? meta.data ?? {};
    const url: string = data.url;
    if (!url) {
      return NextResponse.json(
        { status: 404, message: 'This document is no longer available' },
        { status: 404 }
      );
    }

    const upstream = await fetch(url);
    if (!upstream.ok) {
      return NextResponse.json(
        { status: 502, message: 'Could not load this document right now' },
        { status: 502 }
      );
    }

    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'pdf';
    const safe = String(data.title || data.documentType || 'document').replace(
      /[^\w.-]+/g,
      '_'
    );

    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safe}.${ext}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    return NextResponse.json(
      {
        status,
        message:
          error?.response?.data?.message || 'Could not download this document',
      },
      { status }
    );
  }
}
