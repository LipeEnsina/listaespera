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
 * Cliente com a service_role key. NUNCA importe isto em componentes de cliente:
 * a chave ignora RLS e dá acesso total à tabela.
 */
export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
