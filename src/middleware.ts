import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

    // Allow short URL routes (single segment paths)
    if (/^\/[^\/]+$/.test(pathname)) {
      return NextResponse.next()
    }

    // Redirect other paths to app subdomain
    return NextResponse.redirect(new URL(`https://app.uper.li${pathname}`))
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