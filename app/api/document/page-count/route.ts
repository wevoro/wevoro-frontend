import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * How many pages a PDF has, for the "Page 1 of 3" bar in the document preview.
 *
 * The browser cannot read this itself: the file lives on the CDN, which does not
 * send CORS headers, so a client-side fetch is blocked. Reading it here — on the
 * server, where there is no CORS — is the only way to show a real count instead
 * of a made-up one.
 *
 * Two guards, because a route that fetches whatever URL it is handed is an open
 * proxy: the caller must be signed in, and the URL must be our own CDN.
 */
const ALLOWED_HOSTS = new Set(['wevoro.b-cdn.net']);

export async function POST(request: NextRequest) {
  if (!cookies().get('accessToken')?.value) {
    return NextResponse.json({ status: 401, message: 'Not signed in' }, { status: 401 });
  }

  let url: string;
  try {
    ({ url } = await request.json());
  } catch {
    return NextResponse.json({ status: 400, message: 'Bad request' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ status: 400, message: 'Bad request' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ status: 400, message: 'Bad request' }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString());
    if (!res.ok) throw new Error(String(res.status));
    const bytes = new Uint8Array(await res.arrayBuffer());

    const { getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(bytes);
    return NextResponse.json({ status: 200, pages: pdf.numPages });
  } catch {
    // Not a PDF, or unreadable. The page bar simply does not render — the
    // document still opens.
    return NextResponse.json({ status: 200, pages: null });
  }
}
