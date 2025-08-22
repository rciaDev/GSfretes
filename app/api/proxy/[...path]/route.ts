import { NextRequest, NextResponse } from 'next/server';

export async function handler(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/proxy/', '');
  const url = `http://api-gsfretes.rcia.com.br/${path}`;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(req.headers),
    },
    body: req.method !== 'GET' ? await req.text() : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return new NextResponse(JSON.stringify(body), {
    status: response.status,
    headers: { 'Content-Type': contentType },
  });
}
