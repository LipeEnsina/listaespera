import Image from "next/image";
import Link from "next/link";
import BackgroundFX from "@/components/BackgroundFX";
import { getServiceClient, isSupabaseConfigured, type WaitlistRow } from "@/lib/supabase";
import AdminTable from "./AdminTable";
import LogoutButton from "./LogoutButton";

export const metadata = {
  title: "Inscritos · Painel Lipe Ensina",
  robots: { index: false, follow: false },
};

// Sempre dados frescos: uma lista de espera muda o tempo todo.
export const dynamic = "force-dynamic";

async function loadRows(): Promise<{ rows: WaitlistRow[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      rows: [],
      error:
        "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    };
  }

  const { data, error } = await getServiceClient()
    .from("waitlist")
    .select("id, created_at, nome, email, telefone, objetivo, consentimento, origem, status")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("[admin] falha ao carregar inscritos:", error);
    return { rows: [], error: "Não foi possível carregar os inscritos." };
  }

  return { rows: (data ?? []) as WaitlistRow[], error: null };
}

export default async function AdminPage() {
  const { rows, error } = await loadRows();

  const now = Date.now();
  const inDays = (days: number) =>
    rows.filter((r) => now - new Date(r.created_at).getTime() < days * 86_400_000)
      .length;

  const stats = [
    { label: "Total na lista", value: rows.length },
    { label: "Últimas 24h", value: inDays(1) },
    { label: "Últimos 7 dias", value: inDays(7) },
    {
      label: "Aguardando contato",
      value: rows.filter((r) => r.status === "novo").length,
    },
  ];

  return (
    <>
      <BackgroundFX variant="calm" />

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
            <Image
              src="/HORN-LIPE-MAGENTA.png"
              alt=""
              width={36}
              height={36}
              priority
              className="h-8 w-8"
            />
            <span className="hidden font-display text-lg uppercase tracking-wide sm:block">
              Painel
            </span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8">
        <h1 className="headline text-4xl sm:text-5xl">Inscritos</h1>
        <p className="mt-2 text-white/50">
          Todo mundo que entrou na lista de espera da mentoria.
        </p>

        {error ? (
          <p className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
            {error}
          </p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-3xl tabular-nums sm:text-4xl">
                    {stat.value.toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <AdminTable rows={rows} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
