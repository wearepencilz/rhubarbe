import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isLoginRoute = createRouteMatcher(['/admin/login(.*)']);

// Known French slug → English route mappings for pages with dedicated Next.js routes
const FR_SLUGS: Record<string, string> = {
  'accueil': '/',
  'recettes': '/recipes',
  'merci': '/thank-you',
};

function detectLocale(req: { cookies: { get(name: string): { value: string } | undefined }; headers: { get(name: string): string | null } }): 'fr' | 'en' {
  // 1. Cookie (user's explicit choice)
  const cookie = req.cookies.get('locale')?.value;
  if (cookie === 'en' || cookie === 'fr') return cookie;
  // 2. Accept-Language header
  const accept = req.headers.get('accept-language') || '';
  if (/^en/i.test(accept)) return 'en';
  // 3. Default to French
  return 'fr';
}

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;

  // Skip static/api/admin
  if (path.startsWith('/api') || path.startsWith('/admin') || path.startsWith('/_next') || path.includes('.')) {
    if (isLoginRoute(req)) return;
    if (isAdminRoute(req)) { await auth.protect(); }
    return;
  }

  // ── Locale prefix handling: /fr/... or /en/... ───────────
  const localeMatch = path.match(/^\/(fr|en)(\/.*)?$/);
  if (localeMatch) {
    const locale = localeMatch[1];
    let rest = localeMatch[2] || '/';

    const setCookie = (res: NextResponse) => {
      res.cookies.set('locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
      return res;
    };

    // /fr/home or /en/home → redirect to /fr or /en (clean URL)
    if (rest === '/home') {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}`;
      return setCookie(NextResponse.redirect(url, 301));
    }

    // For French locale, check translated slugs
    if (locale === 'fr') {
      const slug = rest.replace(/^\//, '').split('/')[0];
      if (FR_SLUGS[slug] !== undefined) {
        const url = req.nextUrl.clone();
        url.pathname = FR_SLUGS[slug] || rest;
        return setCookie(NextResponse.rewrite(url));
      }
    }

    // Known Next.js routes — rewrite without locale prefix
    const knownRoutes = ['/', '/contact', '/thank-you', '/order', '/catering', '/cake'];
    const knownPrefixes = ['/journal', '/recipes'];
    if (knownRoutes.includes(rest) || knownPrefixes.some(p => rest === p || rest.startsWith(p + '/'))) {
      const url = req.nextUrl.clone();
      url.pathname = rest;
      return setCookie(NextResponse.rewrite(url));
    }

    // Composed pages → /p/[slug]
    const slug = rest.replace(/^\//, '');
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${slug}`;
      return setCookie(NextResponse.rewrite(url));
    }

    // /fr or /en root → rewrite to /
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return setCookie(NextResponse.rewrite(url));
  }

  // ── Legacy redirects ─────────────────────────────────────
  if (path === '/stories' || path.startsWith('/stories/')) {
    const url = req.nextUrl.clone();
    url.pathname = path.replace(/^\/stories/, '/journal');
    return NextResponse.redirect(url, 301);
  }

  // ── Bare URLs → redirect to locale-prefixed ──────────────
  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${path}`;
  return NextResponse.redirect(url, 307);
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
