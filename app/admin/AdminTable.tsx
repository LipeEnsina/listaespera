"use client";

import { useMemo, useState } from "react";
import { formatPhoneBR } from "@/lib/validation";
import type { WaitlistRow, WaitlistStatus } from "@/lib/supabase";

const STATUS_META: Record<WaitlistStatus, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-magenta/15 text-magenta border-magenta/30" },
  contatado: {
    label: "Contatado",
    className: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  },
  aprovado: {
    label: "Aprovado",
    className: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  },
  descartado: {
    label: "Descartado",
    className: "bg-white/[0.05] text-white/40 border-white/10",
  },
};

const STATUS_ORDER: WaitlistStatus[] = ["novo", "contatado", "aprovado", "descartado"];
const PAGE_SIZE = 25;

export default function AdminTable({ rows }: { rows: WaitlistRow[] }) {
  const [data, setData] = useState(rows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | WaitlistStatus>("todos");
  const [oldestFirst, setOldestFirst] = useState(false);
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D+/g, "");

    const result = data.filter((row) => {
      if (statusFilter !== "todos" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.nome.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (digits.length >= 3 && row.telefone.includes(digits)) ||
        (row.objetivo ?? "").toLowerCase().includes(q)
      );
    });

    return oldestFirst ? [...result].reverse() : result;
  }, [data, query, statusFilter, oldestFirst]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  async function updateStatus(id: string, status: WaitlistStatus) {
    const previous = data;
    setSaveError("");
    setSaving(id);
    // Atualização otimista: a UI responde na hora e reverte se der erro.
    setData((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));

    try {
      const response = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message);
      }
    } catch (err) {
      setData(previous);
      setSaveError(
        (err instanceof Error && err.message) ||
          "Não foi possível salvar o status. Tente de novo.",
      );
    } finally {
      setSaving(null);
    }
  }

  function exportCsv() {
    const header = [
      "Nome",
      "Email",
      "Telefone",
      "Objetivo",
      "Status",
      "Origem",
      "Data de cadastro",
    ];

    const lines = filtered.map((row) => [
      row.nome,
      row.email,
      formatPhoneBR(row.telefone),
      row.objetivo ?? "",
      STATUS_META[row.status]?.label ?? row.status,
      row.origem ?? "",
      new Date(row.created_at).toLocaleString("pt-BR"),
    ]);

    const csv = [header, ...lines]
      .map((cells) => cells.map(csvCell).join(";"))
      .join("\r\n");

    // BOM para o Excel abrir acentos corretamente.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `lista-espera-lipe-ensina-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* ---------- CONTROLES ---------- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            style={{ width: 18, height: 18 }}
          >
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome, e-mail, telefone ou objetivo…"
            className="field pl-11"
            aria-label="Buscar inscritos"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(0);
            }}
            aria-label="Filtrar por status"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-magenta/60"
          >
            <option value="todos">Todos os status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOldestFirst((v) => !v)}
            className="btn-ghost !rounded-2xl !px-4 !py-3"
          >
            {oldestFirst ? "Mais antigos" : "Mais recentes"}
          </button>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-magenta px-4 py-3 text-sm font-semibold text-white transition hover:bg-magenta-400 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
              <path
                d="M12 3v12m0 0l4.5-4.5M12 15l-4.5-4.5M4 18v2a1 1 0 001 1h14a1 1 0 001-1v-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            CSV
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-white/40">
        <p>
          {filtered.length.toLocaleString("pt-BR")}{" "}
          {filtered.length === 1 ? "inscrito" : "inscritos"}
          {filtered.length !== data.length && ` de ${data.length.toLocaleString("pt-BR")}`}
        </p>
        {saveError && <p className="text-red-400">{saveError}</p>}
      </div>

      {/* ---------- TABELA (desktop) ---------- */}
      <div className="mt-4 hidden overflow-hidden rounded-3xl border border-white/[0.08] lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03] text-left">
                <Th>#</Th>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Telefone</Th>
                <Th>Objetivo</Th>
                <Th>Entrou em</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.05] transition last:border-0 hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-4 tabular-nums text-white/30">
                    {safePage * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-4 py-4 font-medium text-white">{row.nome}</td>
                  <td className="px-4 py-4">
                    <CopyableEmail email={row.email} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <WhatsAppLink telefone={row.telefone} nome={row.nome} />
                  </td>
                  <td className="max-w-[22rem] px-4 py-4 text-white/50">
                    {row.objetivo ? (
                      <span title={row.objetivo} className="line-clamp-2">
                        {row.objetivo}
                      </span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-white/50">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusSelect
                      value={row.status}
                      busy={saving === row.id}
                      onChange={(s) => updateStatus(row.id, s)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && <EmptyState hasFilter={Boolean(query) || statusFilter !== "todos"} />}
      </div>

      {/* ---------- CARTÕES (mobile) ---------- */}
      <div className="mt-4 space-y-3 lg:hidden">
        {visible.map((row) => (
          <article key={row.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-white">{row.nome}</h3>
                <p className="mt-0.5 text-xs text-white/35">{formatDate(row.created_at)}</p>
              </div>
              <StatusSelect
                value={row.status}
                busy={saving === row.id}
                onChange={(s) => updateStatus(row.id, s)}
              />
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/30">E-mail</dt>
                <dd className="mt-0.5">
                  <CopyableEmail email={row.email} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-white/30">Telefone</dt>
                <dd className="mt-0.5">
                  <WhatsAppLink telefone={row.telefone} nome={row.nome} />
                </dd>
              </div>
              {row.objetivo && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/30">Objetivo</dt>
                  <dd className="mt-0.5 leading-relaxed text-white/60">{row.objetivo}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}

        {visible.length === 0 && (
          <div className="card">
            <EmptyState hasFilter={Boolean(query) || statusFilter !== "todos"} />
          </div>
        )}
      </div>

      {/* ---------- PAGINAÇÃO ---------- */}
      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="btn-ghost disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="text-sm tabular-nums text-white/45">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="btn-ghost disabled:opacity-30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
      {children}
    </th>
  );
}

function StatusSelect({
  value,
  busy,
  onChange,
}: {
  value: WaitlistStatus;
  busy: boolean;
  onChange: (status: WaitlistStatus) => void;
}) {
  const meta = STATUS_META[value] ?? STATUS_META.novo;
  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as WaitlistStatus)}
      aria-label="Alterar status"
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition disabled:opacity-50 ${meta.className}`}
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s} className="bg-ink-card text-white">
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

function CopyableEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      title="Copiar e-mail"
      className="max-w-full truncate text-left text-white/70 transition hover:text-magenta"
    >
      {copied ? "Copiado!" : email}
    </button>
  );
}

function WhatsAppLink({ telefone, nome }: { telefone: string; nome: string }) {
  const digits = telefone.replace(/\D+/g, "");
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const message = encodeURIComponent(
    `Oi, ${primeiroNome}! Aqui é do Lipe Ensina — você entrou na lista de espera da mentoria.`,
  );

  return (
    <a
      href={`https://wa.me/55${digits}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-emerald-400"
      title="Abrir conversa no WhatsApp"
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.45 0 9.89-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.81.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.23 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23a7.4 7.4 0 0 1-1.37-1.71c-.15-.24-.02-.38.1-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.55-.43h-.48c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.17 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.44-.59 1.65-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.47-.28Z" />
      </svg>
      {formatPhoneBR(telefone)}
    </a>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-display text-2xl uppercase text-white/25">
        {hasFilter ? "Nada por aqui" : "Lista vazia"}
      </p>
      <p className="mt-2 text-sm text-white/40">
        {hasFilter
          ? "Nenhum inscrito bate com essa busca. Tente outro termo ou limpe o filtro."
          : "Assim que alguém entrar na lista de espera, aparece aqui."}
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Escapa a célula e neutraliza fórmulas: uma célula começando com = + - @
 * vira comando ao abrir no Excel/Sheets (CSV injection).
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
