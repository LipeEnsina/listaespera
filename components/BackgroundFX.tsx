/**
 * Camada decorativa do fundo: brilhos magenta, grade sutil e grão.
 * Fica fixa atrás de tudo e não intercepta cliques.
 *
 * variant="calm" é para o painel: lá o fundo não pode competir com os dados.
 */
export default function BackgroundFX({
  variant = "hero",
}: {
  variant?: "hero" | "calm";
}) {
  const calm = variant === "calm";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink grain"
    >
      {/* Brilho principal atrás do herói */}
      <div
        className={`absolute -top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full blur-[130px] ${
          calm ? "bg-magenta/[0.05]" : "bg-magenta/[0.16] animate-float-slow"
        }`}
      />
      {/* Brilho secundário, para dar profundidade */}
      <div
        className={`absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full blur-[120px] ${
          calm ? "bg-magenta/[0.03]" : "bg-magenta/[0.09]"
        }`}
      />
      {/* Grade técnica — referência ao mundo da engenharia */}
      <div
        className={calm ? "absolute inset-0 opacity-[0.1]" : "absolute inset-0 opacity-[0.18]"}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "68px 68px",
          maskImage:
            "radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 55% at 50% 0%, #000 30%, transparent 78%)",
        }}
      />
    </div>
  );
}
