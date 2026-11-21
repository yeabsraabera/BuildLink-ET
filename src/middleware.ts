import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "buildlink_token";

function isPublicPage(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

function isPublicApi(pathname: string) {
  return pathname.startsWith("/api/auth/") || pathname === "/api/locations" || pathname === "/api/stats";
}

async function hasSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return Boolean(payload.sub);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = await hasSession(request);

  if (pathname.startsWith("/api/")) {
    if (signedIn || isPublicApi(pathname)) return NextResponse.next();
    return NextResponse.json({ success: false, message: "Sign in required" }, { status: 401 });
  }

  if (signedIn || isPublicPage(pathname)) return NextResponse.next();

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
