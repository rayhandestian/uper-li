import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const APP_ROUTES = [
  '/dashboard',
  '/login',
  '/register',
  '/terms',
  '/privacy',
  '/contact',
  '/verify',
  '/admin'
]

export function middleware(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl

  // Allow all routes on app subdomain
  if (hostname === 'app.uper.li') {
    return NextResponse.next()
  }

  // For uper.li
  if (hostname === 'uper.li') {
    // Redirect root to app homepage
    if (pathname === '/') {
      return NextResponse.redirect(new URL('https://app.uper.li'))
    }

    // Redirect app-specific routes to app subdomain
    if (APP_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL(`https://app.uper.li${pathname}`))
    }

    // Allow short URL routes (single segment paths that are not app routes)
    if (/^\/[^\/]+$/.test(pathname)) {
      return NextResponse.next()
    }

    // Redirect other paths to app subdomain
    return NextResponse.redirect(new URL(`https://app.uper.li${pathname}`))
  }

  // For admin subdomain
  if (hostname === 'admin.uper.li') {
    const url = request.nextUrl.clone()
    if (pathname === '/') {
      url.pathname = '/admin'
    } else if (pathname === '/login') {
      url.pathname = '/login-admin'
    } else if (pathname === '/login-admin') {
      return NextResponse.next()
    } else if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname}`
    }
    return NextResponse.rewrite(url)
  }

  // For other hostnames (e.g., localhost in development), allow all
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}