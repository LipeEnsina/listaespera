import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { waitlistSchema, fieldErrors, onlyDigits } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Só divulgamos o total depois que ele deixa de parecer uma sala vazia. */
const COUNT_VISIBLE_THRESHOLD = 20;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ total: 0, showTotal: false });
  }

  try {
    const { count, error } = await getServiceClient()
      .from("waitlist")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    const total = count ?? 0;
    return NextResponse.json(
      { total, showTotal: total >= COUNT_VISIBLE_THRESHOLD },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
    );
  } catch {
    return NextResponse.json({ total: 0, showTotal: false });
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);

  const limited = rateLimit(`waitlist:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { message: "Muitas tentativas. Aguarde um instante e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: "Cadastro indisponível no momento. Tente novamente em alguns minutos." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Confira os campos destacados.", errors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot preenchido = bot. Responde 200 para não ensinar o robô a passar.
  if (data.website) {
    return NextResponse.json({ ok: true, duplicate: false });
  }

  try {
    const { error } = await getServiceClient().from("waitlist").insert({
      nome: data.nome,
      email: data.email,
      telefone: onlyDigits(data.telefone),
      objetivo: data.objetivo || null,
      consentimento: true,
      origem: data.origem || null,
    });

    if (error) {
      // 23505 = violação do índice único de e-mail.
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, duplicate: false });
  } catch (err) {
    console.error("[waitlist] falha ao inserir:", err);
    return NextResponse.json(
      { message: "Não conseguimos salvar agora. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
