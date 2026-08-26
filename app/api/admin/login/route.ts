import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkCredentials,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  // Bem mais apertado que o formulário público: 8 tentativas a cada 10 min.
  const limited = rateLimit(`login:${ip}`, { limit: 8, windowMs: 10 * 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      {
        message: `Muitas tentativas. Tente novamente em ${Math.ceil(
          limited.retryAfterSeconds / 60,
        )} min.`,
      },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json(
      { message: "Preencha usuário e senha." },
      { status: 400 },
    );
  }

  let ok = false;
  try {
    ok = await checkCredentials(username, password);
  } catch (err) {
    console.error("[login] configuração ausente:", err);
    return NextResponse.json(
      { message: "Painel não configurado. Confira as variáveis de ambiente." },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json(
      { message: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }

  try {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(username),
      sessionCookieOptions,
    );
    return response;
  } catch (err) {
    // Cai aqui quando ADMIN_SESSION_SECRET falta ou é curto demais.
    console.error("[login] falha ao assinar a sessão:", err);
    return NextResponse.json(
      { message: "Painel não configurado. Confira as variáveis de ambiente." },
      { status: 500 },
    );
  }
}
