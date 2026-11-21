import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "buildlink_token";

function isPublicPage(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

function isPublicApi(pathname: string, method: string) {
  if (pathname.startsWith("/api/auth/") || pathname === "/api/stats") return true;
  return pathname === "/api/locations" && method === "GET";
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

function isStaticAsset(pathname: string) {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|ico|txt|xml|woff2?)$/i.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStaticAsset(pathname)) return NextResponse.next();
  const signedIn = await hasSession(request);

  if (pathname.startsWith("/api/")) {
    if (signedIn || isPublicApi(pathname, request.method)) return NextResponse.next();
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
