import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetch a file from our CDN on the server and hand it back to the browser.
 *
 * The CDN sends no CORS header, so the browser cannot fetch it directly
 * (SCRUM-148). Two guards, because a route that fetches whatever URL it is
 * handed is an open proxy: the caller must be signed in, and the URL must be
 * our own CDN.
 */
const ALLOWED_HOSTS = new Set(['wevoro.b-cdn.net']);

export async function POST(req: NextRequest) {
  if (!cookies().get('accessToken')?.value) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
    const response = await fetch(parsed.toString(), { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const name = parsed.pathname.split('/').pop() || 'document';

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Length': String(arrayBuffer.byteLength),
        'Content-Disposition': `attachment; filename="${name.replace(/[^\w.-]+/g, '_')}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
