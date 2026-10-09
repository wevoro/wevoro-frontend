import api from '@/lib/axiosInterceptor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * SCRUM-119 (A10) — one signed document from a paid packet, saved rather than
 * opened. Same shape as download-file: the backend checks access and payment
 * and writes the audit row, then the bytes are re-sent from our origin as an
 * attachment so the browser saves them.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { caregiverId: string; itemId: string } }
) {
  try {
    const meta = await api.get(
      `/document/download-signed/${params.caregiverId}/${params.itemId}`
    );
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
    const safe = String(data.title || 'signed-document').replace(/[^\w.-]+/g, '_');

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
