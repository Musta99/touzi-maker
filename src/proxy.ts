import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';

export const locales = ['en', 'bn'];
export const defaultLocale = 'en';

function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return locales.includes(potentialLocale) ? potentialLocale : defaultLocale;
}

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Redirect root to default locale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, req.url));
  }

  // Add locale prefix if missing
  if (!pathnameHasLocale(pathname)) {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, req.url));
  }

  const session = await auth();
  const locale = getLocaleFromPathname(pathname);

  const isLoginPage = pathname === `/${locale}/login`;
  const isAuthPage = pathname.startsWith(`/${locale}/login`);

  // Redirect logged-in users away from login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Redirect unauthenticated users to login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
