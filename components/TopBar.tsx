import Image from "next/image";
import Link from "next/link";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition hover:opacity-80"
          aria-label="Lipe Ensina — início"
        >
          {/* O wordmark já traz a mãozinha no lockup — não repetimos o ícone. */}
          <Image
            src="/LOGO-LIPE-ENSINA-BRANCO.png"
            alt="Lipe Ensina"
            width={200}
            height={97}
            priority
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <Link
          href="/admin/login"
          className="btn-ghost"
          aria-label="Entrar no painel administrativo"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
            <path
              d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Admin
        </Link>
      </div>
    </header>
  );
}
