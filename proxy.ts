import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export default async function proxy(req: NextRequest) {
  const session = await getToken({ req });

  if (req.nextUrl.pathname.includes('/admin')) {
    console.log('Admin route access attempt:', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      userRole: session?.role,
      userEmail: session?.email,
    });

    if (!session || session.role == 'User') {
      console.log('Access denied - redirecting to home');
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log('Access granted to admin route');
  }

  return NextResponse.next();
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
};
