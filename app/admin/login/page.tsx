import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import BackgroundFX from "@/components/BackgroundFX";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Entrar · Painel Lipe Ensina",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <BackgroundFX />
      <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
        <Link href="/" className="mb-10 transition hover:opacity-80">
          <Image
            src="/LOGO-LIPE-ENSINA-BRANCO.png"
            alt="Lipe Ensina"
            width={200}
            height={97}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="card-solid w-full max-w-sm p-7 shadow-card sm:p-9">
          <h1 className="headline text-3xl">Painel</h1>
          <p className="mt-2 text-sm text-white/50">
            Acesso restrito à equipe do Lipe Ensina.
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-8 text-sm text-white/40 transition hover:text-white"
        >
          ← Voltar para a lista de espera
        </Link>
      </main>
    </>
  );
}
