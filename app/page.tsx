import LinesBackground from "@/components/LinesBackground";
import TopBar from "@/components/TopBar";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import WaitlistCounter from "@/components/WaitlistCounter";
import WaitlistForm from "@/components/WaitlistForm";
import InstagramLinks from "@/components/InstagramLinks";

export default function Home() {
  return (
    /* Coluna de altura total: o herói ocupa o espaço que sobra, e a faixa +
       rodapé encostam embaixo. No desktop a página fecha em uma tela só. */
    <div className="flex min-h-svh flex-col">
      <LinesBackground />
      <TopBar />

      <main className="flex flex-1 flex-col">
        <section className="container-page flex flex-1 items-center py-6 lg:py-8">
          <div className="grid w-full items-center gap-9 lg:grid-cols-[1fr_460px] lg:gap-14">
            <div>
              <Reveal>
                <span className="inline-flex items-center rounded-full border border-magenta/30 bg-magenta/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-magenta">
                  Mentoria
                </span>
              </Reveal>

              <Reveal delay={70}>
                <h1 className="headline mt-4 text-[2.6rem] leading-[0.88] sm:text-6xl lg:text-[4.2rem]">
                  <span className="block text-white">Lista de</span>
                  <span className="block text-gradient-magenta">espera</span>
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <p className="mt-5 max-w-lg leading-relaxed text-white/70 sm:text-lg">
                  A mentoria do{" "}
                  <strong className="font-semibold text-white">
                    Lipe Ensina
                  </strong>{" "}
                  para quem quer parar de postar no escuro: posicionamento,
                  conteúdo e visibilidade — com o método de quem construiu{" "}
                  <strong className="font-semibold text-white">
                    +1,6 milhão
                  </strong>{" "}
                  de seguidores do zero.
                </p>
              </Reveal>

              <Reveal delay={210}>
                {/* Some sozinho enquanto o total ainda não é relevante */}
                <WaitlistCounter />

                <a
                  href="#formulario"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-magenta decoration-2 underline-offset-[6px] transition hover:text-magenta lg:hidden"
                >
                  Entrar na lista
                  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
                    <path
                      d="M12 5v14m0 0l6-6m-6 6l-6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </Reveal>

              <Reveal delay={280}>
                <InstagramLinks className="mt-7 border-t border-white/[0.07] pt-6" />
              </Reveal>
            </div>

            <Reveal delay={120}>
              <div id="formulario" className="scroll-mt-20">
                <WaitlistForm />
              </div>
            </Reveal>
          </div>
        </section>

        <Marquee />
      </main>

      <footer className="py-4">
        <div className="container-page flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:justify-between sm:text-left">
          <p className="text-white/30">
            © {new Date().getFullYear()} Lipe Ensina
          </p>
          <span className="text-white/25">Dados protegidos pela LGPD</span>
        </div>
      </footer>
    </div>
  );
}
