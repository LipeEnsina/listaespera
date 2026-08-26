"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Total de inscritos, buscado da API.
 * O servidor só marca showTotal quando o número já é relevante — antes disso
 * mostramos a prova social qualitativa em vez de "3 pessoas na lista".
 */
export default function WaitlistCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    let active = true;

    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((data: { total: number; showTotal: boolean }) => {
        if (active && data.showTotal) setTotal(data.total);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Contagem crescente até o valor real.
  useEffect(() => {
    if (total === null) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(total);
      return;
    }

    const duration = 1100;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(total * eased));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [total]);

  // Sem número real para mostrar, o componente não ocupa espaço nenhum.
  if (total === null) return null;

  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-magenta animate-pulse-ring" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-magenta" />
      </span>
      <p className="text-sm text-white/60">
        <span className="font-semibold tabular-nums text-white">
          {display.toLocaleString("pt-BR")}
        </span>{" "}
        pessoas já estão na fila
      </p>
    </div>
  );
}
