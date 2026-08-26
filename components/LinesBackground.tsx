"use client";

import dynamic from "next/dynamic";

/**
 * O three.js pesa ~150 kB e o efeito é puramente decorativo. Carregando sob
 * demanda (sem SSR), o HTML e o formulário pintam imediatamente sobre o preto
 * e as linhas entram depois, sem segurar o first paint nem o 4G do celular.
 */
const FloatingLines = dynamic(() => import("./FloatingLines"), { ssr: false });

/** Rampa magenta da marca: do vinho escuro ao rosa claro. */
const GRADIENT = ["#8B0F4B", "#FF0080", "#FF9AD5"];

export default function LinesBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <FloatingLines
        linesGradient={GRADIENT}
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={[7, 6, 5]}
        lineDistance={[5, 5, 5]}
        topWavePosition={{ x: 10.0, y: 0.5, rotate: -0.4 }}
        middleWavePosition={{ x: 5.0, y: 0.0, rotate: 0.2 }}
        bottomWavePosition={{ x: 2.0, y: -0.7, rotate: -1 }}
        animationSpeed={0.85}
        bendRadius={5}
        bendStrength={-0.5}
        mouseDamping={0.05}
        parallaxStrength={0.18}
        mixBlendMode="screen"
      />

      {/* Escurece só a faixa da esquerda, onde mora o texto do herói: o lado
          direito é o card opaco, então lá o brilho pode ficar cheio. */}
      <div className="absolute inset-0 bg-ink/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/5 to-transparent" />

      <div className="grain absolute inset-0" />
    </div>
  );
}
