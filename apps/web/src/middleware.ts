import { auth } from '@/auth';

/** Protect app routes; unauthenticated users are redirected to /login by Auth.js. */
export default auth((req) => {
  const isProtected = ['/dashboard', '/workspace', '/upload', '/billing', '/settings', '/admin'].some(
    (p) => req.nextUrl.pathname.startsWith(p),
  );
  if (isProtected && !req.auth) {
    const url = new URL('/login', req.nextUrl.origin);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
