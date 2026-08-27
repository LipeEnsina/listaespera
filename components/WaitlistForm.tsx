"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  formatPhoneBR,
  waitlistSchema,
  fieldErrors,
} from "@/lib/validation";

const INSTAGRAM_URL = "https://www.instagram.com/llipe.ensina/";
const MAX_OBJETIVO = 400;

type Values = {
  nome: string;
  email: string;
  telefone: string;
  objetivo: string;
  consentimento: boolean;
  website: string; // honeypot
};

const EMPTY: Values = {
  nome: "",
  email: "",
  telefone: "",
  objetivo: "",
  consentimento: false,
  website: "",
};

export default function WaitlistForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const origem = useRef("");
  const successRef = useRef<HTMLDivElement>(null);

  // Guarda de onde a pessoa veio (link da bio, campanha, etc).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source")?.trim() || params.get("ref")?.trim();

    if (utm) {
      origem.current = utm.slice(0, 120);
      return;
    }

    // `new URL` lança em referrer malformado, e isso derrubaria o effect
    // inteiro — a origem é um extra, nunca pode atrapalhar o cadastro.
    try {
      origem.current = document.referrer
        ? new URL(document.referrer).hostname
        : "direto";
    } catch {
      origem.current = "direto";
    }
  }, []);

  // Leva o foco para a confirmação — importante para leitores de tela.
  useEffect(() => {
    if (status === "done") successRef.current?.focus();
  }, [status]);

  function setField<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  /** Valida um campo isolado, para dar retorno assim que a pessoa sai dele. */
  function validateField(key: keyof Values) {
    setTouched((t) => ({ ...t, [key]: true }));
    const result = waitlistSchema.safeParse({ ...values, origem: origem.current });
    if (result.success) {
      setErrors((e) => ({ ...e, [key]: "" }));
      return;
    }
    const all = fieldErrors(result.error);
    setErrors((e) => ({ ...e, [key]: all[key] ?? "" }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");

    const payload = {
      ...values,
      objetivo: values.objetivo.trim(),
      origem: origem.current,
    };

    const parsed = waitlistSchema.safeParse(payload);
    if (!parsed.success) {
      const all = fieldErrors(parsed.error);
      setErrors(all);
      setTouched({
        nome: true,
        email: true,
        telefone: true,
        consentimento: true,
      });
      // Rola até o primeiro campo com problema.
      const first = document.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus({ preventScroll: true });
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.message ?? "Algo deu errado. Tente novamente.");
        setStatus("idle");
        return;
      }

      setDuplicate(Boolean(data.duplicate));
      setStatus("done");
    } catch {
      setFormError("Sem conexão. Verifique sua internet e tente de novo.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return <SuccessCard duplicate={duplicate} ref={successRef} />;
  }

  const invalid = (key: keyof Values) => Boolean(touched[key] && errors[key]);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="card-solid relative overflow-hidden p-5 shadow-card sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-magenta/[0.12] blur-[90px]"
      />

      <div className="relative">
        <h2 className="headline text-2xl text-white sm:text-3xl">
          Garanta seu lugar
        </h2>
        <p className="mt-1.5 text-sm text-white/50">
          Leva 30 segundos. As vagas abrem por ordem de entrada.
        </p>

        <div className="mt-5 space-y-3">
          <Field
            id="nome"
            label="Nome completo"
            error={invalid("nome") ? errors.nome : ""}
          >
            <input
              id="nome"
              name="name"
              type="text"
              autoComplete="name"
              enterKeyHint="next"
              placeholder="Seu nome e sobrenome"
              className={`field ${invalid("nome") ? "field-error" : ""}`}
              value={values.nome}
              data-invalid={invalid("nome")}
              aria-invalid={invalid("nome")}
              aria-describedby={invalid("nome") ? "nome-error" : undefined}
              onChange={(e) => setField("nome", e.target.value)}
              onBlur={() => validateField("nome")}
            />
          </Field>

          <Field
            id="email"
            label="E-mail"
            error={invalid("email") ? errors.email : ""}
          >
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              placeholder="seu@email.com"
              className={`field ${invalid("email") ? "field-error" : ""}`}
              value={values.email}
              data-invalid={invalid("email")}
              aria-invalid={invalid("email")}
              aria-describedby={invalid("email") ? "email-error" : undefined}
              onChange={(e) => setField("email", e.target.value)}
              onBlur={() => validateField("email")}
            />
          </Field>

          <Field
            id="telefone"
            label="WhatsApp"
            error={invalid("telefone") ? errors.telefone : ""}
          >
            <div className="relative">
              {/* "+55" em texto, não a bandeira em emoji: emoji de bandeira
                  não renderiza no Windows e vira duas letras soltas. */}
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none border-r border-white/10 pr-3 text-[16px] font-medium text-white/45">
                +55
              </span>
              <input
                id="telefone"
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                enterKeyHint="next"
                placeholder="(11) 91234-5678"
                className={`field pl-[4.6rem] ${invalid("telefone") ? "field-error" : ""}`}
                value={values.telefone}
                data-invalid={invalid("telefone")}
                aria-invalid={invalid("telefone")}
                aria-describedby={
                  invalid("telefone") ? "telefone-error" : undefined
                }
                onChange={(e) => setField("telefone", formatPhoneBR(e.target.value))}
                onBlur={() => validateField("telefone")}
              />
            </div>
          </Field>

          <Field
            id="objetivo"
            label="O que você quer destravar?"
            optional
            error=""
          >
            <textarea
              id="objetivo"
              rows={2}
              maxLength={MAX_OBJETIVO}
              enterKeyHint="done"
              placeholder="Ex: quero começar a postar sobre engenharia e não sei por onde."
              className="field resize-none"
              value={values.objetivo}
              onChange={(e) => setField("objetivo", e.target.value)}
            />
            <p className="mt-1 text-right text-xs tabular-nums text-white/30">
              {values.objetivo.length}/{MAX_OBJETIVO}
            </p>
          </Field>

          {/* Honeypot: escondido de gente, visível para bots. */}
          <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="website">Não preencha este campo</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => setField("website", e.target.value)}
            />
          </div>

          <label
            htmlFor="consentimento"
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
              invalid("consentimento")
                ? "border-red-500/50 bg-red-500/[0.04]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <input
                id="consentimento"
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/25 bg-white/[0.06] transition checked:border-magenta checked:bg-magenta focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
                checked={values.consentimento}
                data-invalid={invalid("consentimento")}
                aria-invalid={invalid("consentimento")}
                onChange={(e) => {
                  setField("consentimento", e.target.checked);
                  setTouched((t) => ({ ...t, consentimento: true }));
                }}
              />
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="pointer-events-none absolute h-3.5 w-3.5 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
              >
                <path
                  d="M4 12.5l5 5L20 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[13px] leading-relaxed text-white/70">
              Autorizo o contato por e-mail e WhatsApp sobre a mentoria do{" "}
              <strong className="font-medium text-white">Lipe Ensina</strong>.
              Meus dados não são vendidos e posso sair da lista quando quiser.
              {invalid("consentimento") && (
                <span className="mt-1 block text-red-400">
                  {errors.consentimento}
                </span>
              )}
            </span>
          </label>

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-primary mt-1"
          >
            {status === "sending" ? (
              <>
                <Spinner />
                Enviando…
              </>
            ) : (
              <>
                Quero minha vaga
                <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
                  <path
                    d="M5 12h13m0 0l-5.5-5.5M18 12l-5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-xs text-white/30">
            Sem spam. Só o aviso de abertura das vagas.
          </p>
        </div>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-white/75"
      >
        {label}
        {optional && (
          <span className="text-xs font-normal text-white/30">opcional</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SuccessCard = forwardRef<HTMLDivElement, { duplicate: boolean }>(
  function SuccessCard({ duplicate }, ref) {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        role="status"
        className="card-solid relative overflow-hidden p-8 text-center shadow-card outline-none sm:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-64 w-64 rounded-full bg-magenta/25 blur-3xl"
        />

        <div className="relative">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-magenta/40 bg-magenta/10">
            <svg viewBox="0 0 52 52" aria-hidden className="h-10 w-10 text-magenta">
              <path
                d="M14 27l8.5 8.5L38 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40"
                strokeDashoffset="40"
                className="animate-draw-check"
              />
            </svg>
          </div>

          <h2 className="headline mt-7 text-4xl text-white sm:text-5xl">
            {duplicate ? "Você já está na lista" : "Tá dentro!"}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            {duplicate
              ? "Esse e-mail já estava cadastrado — seu lugar continua garantido. Fica de olho na caixa de entrada."
              : "Seu lugar na fila está guardado. Quando as vagas abrirem, você recebe o convite por e-mail e WhatsApp antes de todo mundo."}
          </p>

          <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Image
                src="/HORN-LIPE-BRANCO.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
              Seguir @llipe.ensina
            </a>
            <ShareButton />
          </div>

          <p className="mt-8 font-display text-sm uppercase tracking-[0.35em] text-magenta">
            Stay Alive
          </p>
        </div>
      </div>
    );
  },
);

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.origin;
    const text =
      "Entrei na lista de espera da mentoria do Lipe Ensina. Garante a sua também:";

    if (navigator.share) {
      try {
        await navigator.share({ title: "Lipe Ensina · Mentoria", text, url });
        return;
      } catch {
        // Usuário cancelou o compartilhamento — cai no copiar link.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-6 py-4 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
    >
      {copied ? "Link copiado!" : "Indicar para um amigo"}
    </button>
  );
}
