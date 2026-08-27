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

  // O .select() é o que permite saber quantas linhas casaram: sem ele, um
  // update que não encontra nada volta sem erro e a rota responderia 200 para
  // uma alteração que nunca aconteceu — o painel mostraria o novo status e o
  // banco continuaria como estava.
  const { data, error } = await getServiceClient()
    .from("waitlist")
    .update({ status })
    .eq("id", params.id)
    .select("id");

  if (error) {
    console.error("[admin] falha ao atualizar status:", error);
    return NextResponse.json({ message: "Não foi possível salvar." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { message: "Esse inscrito não existe mais. Atualize a página." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
