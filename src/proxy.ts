import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token from cookies
  const token = request.cookies.get('token')?.value;
  const user = token ? await verifyToken(token) : null;

  // 1. Handle API Route Protection
  if (pathname.startsWith('/api/')) {
    // Exclude public auth endpoints
    if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/logout')) {
      return NextResponse.next();
    }

    if (!user) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    // Role-based API protection
    if (pathname.startsWith('/api/admin/') && user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Access denied: Admin role required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    if (pathname.startsWith('/api/cook/') && user.role !== 'cook' && user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Access denied: Cook role required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    // Embed authenticated user info into request headers so API routes can retrieve it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-name', user.name);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Handle Page Protection
  // Exclude assets, public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If already logged in and visiting login, redirect to dashboard
  if (pathname === '/login') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routing paths
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role permissions checks for pages
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/cook') && user.role !== 'cook' && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except public assets:
     * - api/auth/login, api/auth/logout (explicitly ignored in middleware body)
     */
    '/((?!api/auth/login|api/auth/logout|_next/static|_next/image|favicon.ico).*)',
  ],
};
