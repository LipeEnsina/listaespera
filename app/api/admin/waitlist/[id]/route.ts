import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["novo", "contatado", "aprovado", "descartado"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Atualiza o status de um inscrito.
 * Protegido pelo middleware — só chega aqui com sessão válida.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Banco não configurado." }, { status: 503 });
  }

  if (!UUID.test(params.id)) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  const status = body.status;
  if (!status || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }

  const { error } = await getServiceClient()
    .from("waitlist")
    .update({ status })
    .eq("id", params.id);

  if (error) {
    console.error("[admin] falha ao atualizar status:", error);
    return NextResponse.json({ message: "Não foi possível salvar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
