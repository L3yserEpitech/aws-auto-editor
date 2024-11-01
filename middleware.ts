import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { method, nextUrl } = req;

  if (['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].includes(method)) {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unsupported media type, please check the media format.' }),
        {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
