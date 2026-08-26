-- ============================================================
--  Lista de espera · Mentoria Lipe Ensina
--  Cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nome          text        not null,
  email         text        not null,
  telefone      text        not null,
  objetivo      text,
  consentimento boolean     not null default false,
  origem        text,
  status        text        not null default 'novo'
    constraint waitlist_status_check
    check (status in ('novo', 'contatado', 'aprovado', 'descartado'))
);

-- Um e-mail entra uma vez só. O índice é sobre lower(email) para que
-- "Joao@Gmail.com" e "joao@gmail.com" sejam a mesma pessoa.
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

-- Ordenação padrão do painel (mais recentes primeiro).
create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at desc);

-- ------------------------------------------------------------
--  Segurança
-- ------------------------------------------------------------
-- RLS ligado e SEM policies: nenhuma chave pública (anon) lê ou escreve.
-- O acesso acontece só pelo servidor do Next, com a service_role key,
-- que ignora RLS por definição. É por isso que essa chave nunca pode
-- aparecer em código de cliente nem numa variável NEXT_PUBLIC_*.
alter table public.waitlist enable row level security;

-- Revoga o acesso direto dos papéis expostos pela API pública.
revoke all on public.waitlist from anon, authenticated;
