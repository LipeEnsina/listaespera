const PHRASES = [
  "Stay Alive",
  "Posicionamento",
  "Conteúdo que retém",
  "Constância",
  "Visibilidade",
  "Autoridade",
];

/**
 * Faixa infinita. O truque: renderizamos a lista duas vezes e animamos
 * -50% — quando o primeiro bloco sai, o segundo já está no lugar exato.
 */
export default function Marquee() {
  const items = [...PHRASES, ...PHRASES];

  return (
    <div className="relative flex overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-2.5">
      <div className="flex shrink-0 animate-marquee items-center gap-6 pr-6">
        {items.map((phrase, i) => (
          <span key={i} className="flex shrink-0 items-center gap-6">
            <span className="font-display text-sm uppercase tracking-[0.22em] text-white/45 sm:text-base">
              {phrase}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-magenta" />
          </span>
        ))}
      </div>
      {/* Segunda cópia: mantém a faixa preenchida durante o loop */}
      <div
        aria-hidden
        className="flex shrink-0 animate-marquee items-center gap-6 pr-6"
      >
        {items.map((phrase, i) => (
          <span key={i} className="flex shrink-0 items-center gap-6">
            <span className="font-display text-sm uppercase tracking-[0.22em] text-white/45 sm:text-base">
              {phrase}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-magenta" />
          </span>
        ))}
      </div>

      {/* Desvanece nas bordas para o corte não ficar seco */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
