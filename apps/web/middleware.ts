import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/signup'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If user is not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(signInUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isLoggedIn && isPublicRoute) {
    return Response.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

