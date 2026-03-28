import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const isAuthRoute = nextUrl.pathname.startsWith("/login");
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/clients") ||
    nextUrl.pathname.startsWith("/contracts") ||
    nextUrl.pathname.startsWith("/calendar") ||
    nextUrl.pathname.startsWith("/projects") ||
    nextUrl.pathname.startsWith("/production") ||
    nextUrl.pathname.startsWith("/designer") ||
    nextUrl.pathname.startsWith("/manager") ||
    nextUrl.pathname.startsWith("/inventory") ||
    nextUrl.pathname.startsWith("/info") ||
    nextUrl.pathname.startsWith("/mail") ||
    nextUrl.pathname.startsWith("/stats") ||
    nextUrl.pathname.startsWith("/history") ||
    nextUrl.pathname.startsWith("/messages") ||
    nextUrl.pathname.startsWith("/settings");

  // Уже авторизован — перенаправить с логина на дашборд
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Не авторизован — перенаправить на логин
  if (!isLoggedIn && isDashboardRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
