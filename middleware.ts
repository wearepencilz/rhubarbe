import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isLoginRoute = createRouteMatcher(['/admin/login(.*)']);

// Known French slug → English route mappings for pages with dedicated Next.js routes
const FR_SLUGS: Record<string, string> = {
  'accueil': '/',
  'recettes': '/recipes',
  'merci': '/thank-you',
  // journal and contact are the same in both languages
};

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

    // Set locale cookie
    const setCookie = (res: NextResponse) => {
      res.cookies.set('locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
      return res;
    };

    // For French locale, check if the slug is a translated slug
    if (locale === 'fr') {
      const slug = rest.replace(/^\//, '').split('/')[0];
      if (FR_SLUGS[slug] !== undefined) {
        const url = req.nextUrl.clone();
        url.pathname = FR_SLUGS[slug] || rest;
        return setCookie(NextResponse.rewrite(url));
      }
    }

    // For any locale, try /p/[slug] for composed pages (e.g. /fr/recettes, /en/recipes)
    // First strip the locale, then check if it's a known Next.js route
    const knownRoutes = ['/', '/journal', '/recipes', '/contact', '/thank-you', '/order', '/catering', '/cake'];
    if (knownRoutes.includes(rest)) {
      const url = req.nextUrl.clone();
      url.pathname = rest;
      return setCookie(NextResponse.rewrite(url));
    }

    // Otherwise rewrite to /p/[slug] for composed pages
    const slug = rest.replace(/^\//, '');
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/p/${slug}`;
      return setCookie(NextResponse.rewrite(url));
    }

    // Root with locale
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
  const cookie = req.cookies.get('locale')?.value;
  const locale = (cookie === 'en' || cookie === 'fr') ? cookie : 'fr';
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
