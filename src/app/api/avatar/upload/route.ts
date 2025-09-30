import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

import { authenticateApiRequest } from '@/lib/api-auth';

export async function POST(request: Request) {
  const authResult = await authenticateApiRequest();
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Missing file body' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return NextResponse.json(blob);
}
