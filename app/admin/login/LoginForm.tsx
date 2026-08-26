"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }

      // Só aceitamos caminhos internos — bloqueia open redirect via ?next=
      const next = searchParams.get("next");
      const target = next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/admin";

      router.replace(target);
      router.refresh();
    } catch {
      setError("Sem conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <div>
        <label htmlFor="username" className="mb-2 block text-sm font-medium text-white/80">
          Usuário
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/40 transition hover:text-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
              {showPassword ? (
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.6 9.6 0 0112 5c5 0 9 4.5 9 7 0 .9-.9 2.4-2.4 3.8M6.2 6.6C4.2 8 3 9.9 3 12c0 2.5 4 7 9 7 1.4 0 2.6-.3 3.7-.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path
                    d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
