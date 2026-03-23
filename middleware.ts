import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Auth.js v5 uses 'authjs' cookie prefix and different salt
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    salt: '__Secure-authjs.session-token',
    cookieName: '__Secure-authjs.session-token',
  });

  if (pathname === '/admin/login') {
    if (token) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/admin';
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
