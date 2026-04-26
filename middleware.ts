import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isLoginRoute = createRouteMatcher(['/admin/login(.*)']);
const LOCALES = ['fr', 'en'];

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // ── Locale prefix handling ───────────────────────────────
  // /fr/... or /en/... → set cookie + rewrite to path without prefix
  const localeMatch = path.match(/^\/(fr|en)(\/.*)?$/);
  if (localeMatch && !path.startsWith('/api') && !path.startsWith('/admin')) {
    const locale = localeMatch[1];
    const rest = localeMatch[2] || '/';
    const url = req.nextUrl.clone();
    url.pathname = rest;
    const response = NextResponse.rewrite(url);
    response.cookies.set('locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    return response;
  }

  // Redirect bare storefront URLs to locale-prefixed version (skip api, admin, _next, static)
  if (!path.startsWith('/api') && !path.startsWith('/admin') && !path.startsWith('/_next') && !path.includes('.')) {
    const cookie = req.cookies.get('locale')?.value;
    const locale = LOCALES.includes(cookie || '') ? cookie : 'fr';
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${path}`;
    return NextResponse.redirect(url, 307);
  }

  // ── Legacy redirects ─────────────────────────────────────
  if (path === '/stories' || path.startsWith('/stories/')) {
    const newPath = path.replace(/^\/stories/, '/journal');
    const url = req.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url, 301);
  }

  // ── Admin auth ───────────────────────────────────────────
  if (isLoginRoute(req)) return;
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
