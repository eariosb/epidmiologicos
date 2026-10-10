import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Transparent proxy to the local vision service (That_Board tracker).
 * The Python process on the Pi/mini-PC listens on :8765 and exposes:
 *   GET  /blob               → current blob position (camera coords)
 *   POST /calibrate/start    → begin 4-point homography capture
 *   GET  /calibrate/status   → { done, points: [...] }
 *   GET  /homography         → 3x3 matrix once calibrated
 *
 * The browser can't reach the raw socket directly, so all calls come
 * through /api/vision/*. Returns 503 when the service is not running —
 * the course works fine without it (vision only matters on That_Board).
 */
const VISION_URL = process.env.VISION_SERVICE_URL ?? 'http://localhost:8765';
const TIMEOUT_MS = 3000;

/** In production the proxy only runs when the service URL is configured. */
const VISION_ENABLED =
  process.env.VISION_SERVICE_URL !== undefined || process.env.NODE_ENV !== 'production';

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  if (!VISION_ENABLED) {
    return NextResponse.json(
      { error: 'vision service not configured' },
      { status: 503 },
    );
  }
  const path = ((await params).path ?? []).join('/');
  const url = `${VISION_URL}/${path}${req.nextUrl.search}`;
  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : await req.text(),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: 'vision-service-unreachable',
        upstream: VISION_URL,
        hint: 'El servicio de visión (Python/uinput) no está corriendo en esta máquina.',
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
