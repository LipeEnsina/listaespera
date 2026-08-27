import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type WaitlistStatus = "novo" | "contatado" | "aprovado" | "descartado";

export type WaitlistRow = {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  telefone: string;
  objetivo: string | null;
  consentimento: boolean;
  origem: string | null;
  status: WaitlistStatus;
};

let cached: SupabaseClient | null = null;

/**
 * A URL do projeto é lida só aqui, no servidor — nunca no navegador. Por isso
 * o nome correto é SUPABASE_URL, sem o prefixo NEXT_PUBLIC_.
 *
 * O prefixo vem da documentação do Supabase, que assume o cliente rodando no
 * browser. No nosso caso ele é enganoso e a Vercel bloqueia salvar a variável
 * como Secret ("public prefixes expose values to the browser"). Aceitamos o
 * nome antigo como fallback para não quebrar ambientes já configurados.
 */
function getSupabaseUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    undefined
  );
}

/**
 * Cliente com a service_role key. NUNCA importe isto em componentes de cliente:
 * a chave ignora RLS e dá acesso total à tabela.
 */
export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // O App Router do Next troca o fetch global por uma versão com Data
      // Cache. Como o supabase-js chama fetch por baixo, as consultas ficavam
      // em cache entre requisições e o painel exibia linhas antigas — chegou a
      // mostrar um inscrito já apagado. Uma lista de espera precisa ser sempre
      // lida do banco, então desligamos o cache na origem: assim vale para
      // todas as rotas, sem depender de `dynamic`/`revalidate` em cada uma.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
