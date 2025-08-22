import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function PUT(req: NextRequest) {
  return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxy(req);
}

async function handleProxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace('/api/proxy/', '');
  const url = `http://api-gsfretes.rcia.com.br/${path}`;

  const body = req.method !== 'GET' ? await req.text() : undefined;

  const response = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(req.headers),
    },
    body,
  });

  const contentType = response.headers.get('content-type') || '';
  const responseBody = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return new NextResponse(
    contentType.includes('application/json')
      ? JSON.stringify(responseBody)
      : responseBody,
    {
      status: response.status,
      headers: { 'Content-Type': contentType },
    }
  );
}
