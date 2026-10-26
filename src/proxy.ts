import { NextRequest, NextResponse } from 'next/server';
import { isLoopback } from '@/lib/security/local';
export function proxy(request: NextRequest) {
  if (!isLoopback(request.headers.get('host') ?? ''))
    return new NextResponse(
      'Este MVP aceita apenas acesso local. Configure autenticação privada antes de publicar.',
      { status: 403 },
    );
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
