"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Atraso em ms para escalonar itens de uma mesma lista. */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Revela o conteúdo quando ele entra na viewport.
 * IntersectionObserver puro — mais leve que uma lib de animação e sem
 * flash de conteúdo, já que o estado inicial vem do CSS (.reveal).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  // HTMLElement genérico: a tag é dinâmica (div, li, section…) e só usamos
  // classList, que existe em todas elas.
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Sem suporte ou movimento reduzido: mostra na hora.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          window.setTimeout(() => el.classList.add("is-visible"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);

    // Rede de segurança: se o observer não disparar (rolagem restaurada,
    // navegador exótico), o conteúdo aparece mesmo assim. Nada nesta página
    // pode depender de animação para ser lido.
    const fallback = window.setTimeout(() => {
      node.classList.add("is-visible");
      observer.unobserve(node);
    }, 2500 + delay);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [delay]);

  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}
