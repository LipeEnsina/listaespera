import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Barreira do painel: /admin e /api/admin/* exigem sessão válida.
 * /admin/login e as rotas de login/logout ficam de fora, senão ninguém entra.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicAdminRoute =
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout";

  if (isPublicAdminRoute) return NextResponse.next();

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
