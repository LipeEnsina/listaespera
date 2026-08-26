# Lista de espera · Mentoria Lipe Ensina

Landing de captação para a lista de espera da mentoria do **Lipe Ensina**
(@llipe.ensina), com painel administrativo protegido por login.

- **Página pública** (`/`) — uma tela só, sem rolagem de seções: formulário de
  inscrição (nome, e-mail, WhatsApp, objetivo opcional e consentimento LGPD)
  sobre um fundo animado em WebGL.
- **Painel** (`/admin`) — tabela de inscritos com busca, filtro por status,
  link direto pro WhatsApp e exportação em CSV.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres) ·
three.js (fundo).

---

## 1. Criar o banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito
   dá conta de sobra).
2. Abra **SQL Editor → New query**, cole o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e rode.
3. Vá em **Project Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** (em *Project API keys*) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role` ignora as regras de segurança do banco. Ela só é usada
> no servidor e **nunca** pode receber o prefixo `NEXT_PUBLIC_` nem aparecer
> em código de cliente.

## 2. Configurar as variáveis

```bash
cp .env.example .env.local
```

Preencha o `.env.local`:

| Variável | O que é |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta do Supabase (só servidor) |
| `ADMIN_USERNAME` | Usuário do painel |
| `ADMIN_PASSWORD` | Senha do painel |
| `ADMIN_SESSION_SECRET` | Segredo que assina o cookie de sessão |
| `NEXT_PUBLIC_SITE_URL` | Domínio final (usado nas metatags) |

Para gerar o segredo da sessão:

```bash
openssl rand -base64 32
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

- Página: http://localhost:3000
- Painel: http://localhost:3000/admin

## 4. Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Settings → Environment Variables**, cadastre as mesmas seis variáveis
   do `.env.local` (marcando *Production* e *Preview*).
4. Deploy. O link final é o que vai na bio do `@llipe.ensina`.

---

## Como funciona por dentro

### Fluxo de dados

O formulário envia para `POST /api/waitlist`, que valida com Zod, aplica rate
limit por IP e grava no Supabase pelo servidor. **O navegador nunca fala com o
Supabase diretamente** — a tabela está com RLS ligado e sem policies, então
nenhuma chave pública lê ou escreve nela.

### Proteções contra spam

| Camada | O que faz |
| --- | --- |
| Honeypot | Campo invisível `website`; se vier preenchido, é bot |
| Rate limit | 5 envios por IP a cada minuto (8 por 10 min no login) |
| Índice único | `lower(email)` — o mesmo e-mail não entra duas vezes |
| Validação | Zod no cliente **e** no servidor; DDD e formato de celular BR |

O rate limit é em memória. Em serverless cada instância tem a própria, então
é "melhor esforço" — segura rajadas, mas não é barreira distribuída. Se o
volume crescer muito, trocar por Upstash Redis em `lib/rate-limit.ts`.

### Fundo animado

As linhas são um shader GLSL rodando em three.js (`FloatingLines.tsx`). Alguns
cuidados que já estão no código:

- **Carregamento tardio.** O three pesa ~150 kB, então entra por
  `next/dynamic` com `ssr: false`. O HTML e o formulário pintam na hora sobre o
  preto; as linhas surgem depois com um fade. Sem isso, o JS inicial da home
  saltava de 123 kB para 269 kB.
- **Celular.** Abaixo de 768 px a resolução cai para 1.5× e o número de linhas
  para 60% — o shader roda por pixel e é o custo dominante da página.
- **Sem WebGL.** Se o contexto falhar, o componente desiste em silêncio e a
  página fica com o fundo preto. O efeito é decoração, nunca conteúdo.
- **`prefers-reduced-motion`.** Renderiza um quadro só, sem animação, sem
  parallax e sem reagir ao mouse.
- **Aba em segundo plano.** O loop de render pausa no `visibilitychange`.
- **Portabilidade do shader.** Os laços usam teto constante com `break` e o
  degradê é lido comparando o índice do laço, não indexando o array com valor
  calculado — GLSL ES 1.00 só garante o primeiro caso, e sem isso o shader
  falha em compilar em vários drivers Android.

Para mexer nas cores, é a constante `GRADIENT` em `LinesBackground.tsx`.

### Login do painel

Usuário e senha vêm do `.env`. A comparação é em tempo constante (sobre os
hashes), e a sessão é um cookie `httpOnly` assinado com HMAC-SHA256 que expira
em 12 horas. O `middleware.ts` barra `/admin` e `/api/admin/*` sem sessão
válida.

Para trocar a senha: altere `ADMIN_PASSWORD` e faça um novo deploy. Trocar o
`ADMIN_SESSION_SECRET` desloga todo mundo na hora.

### Contador de inscritos

A home mostra o total de pessoas na fila, mas só depois de **20 inscritos** —
antes disso o contador simplesmente não aparece. É proposital: "3 pessoas na
lista" derruba a conversão. O número é sempre o real, nunca inflado. O limite
está em `COUNT_VISIBLE_THRESHOLD`, em `app/api/waitlist/route.ts`.

### Status dos inscritos

Cada pessoa tem um status: `novo` → `contatado` → `aprovado` (ou
`descartado`). Dá pra mudar direto na tabela do painel; a alteração é
otimista e reverte sozinha se o salvamento falhar.

---

## Mapa dos arquivos

```
app/
  page.tsx                       landing pública
  layout.tsx                     fontes, metatags, OG
  api/waitlist/route.ts          POST inscrição · GET contador
  api/admin/login|logout         sessão do painel
  api/admin/waitlist/[id]        PATCH do status
  admin/page.tsx                 painel (server component)
  admin/AdminTable.tsx           tabela, busca, filtros, CSV
  admin/login/                   tela de login
components/
  WaitlistForm.tsx               formulário + estado de sucesso
  WaitlistCounter.tsx            contador animado
  FloatingLines.tsx              shader WebGL das linhas do fundo
  LinesBackground.tsx            monta o shader + véus de contraste
  BackgroundFX.tsx               fundo alternativo (usado no painel)
  InstagramLinks.tsx             atalhos para os dois perfis
  Reveal.tsx                     animação de entrada no scroll
  TopBar.tsx · Marquee.tsx
lib/
  supabase.ts                    cliente service_role (só servidor)
  validation.ts                  schema Zod, máscara e validação de telefone
  session.ts                     cookie assinado (Web Crypto, roda no Edge)
  rate-limit.ts                  limite por IP
middleware.ts                    barreira do /admin
supabase/schema.sql              tabela, índices e RLS
```

## Marca

| Elemento | Valor |
| --- | --- |
| Magenta | `#FF0080` |
| Preto | `#07070A` |
| Display | Anton (com `skewX(-7deg)`, imitando o logotipo) |
| Texto | Inter |
| Perfis | [@lipe.alive](https://www.instagram.com/lipe.alive/) · [@llipe.ensina](https://www.instagram.com/llipe.ensina/) |

Os arquivos de logo ficam em `public/`. O
`LOGO-LIPE-ENSINA-BRANCO.png` foi gerado a partir da versão preta para uso
sobre fundo escuro.
