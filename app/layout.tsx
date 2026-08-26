import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lipeensina.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lista de espera · Mentoria Lipe Ensina",
  description:
    "Entre na lista de espera da mentoria do Lipe Ensina: posicionamento digital, produção de conteúdo e visibilidade nas redes. Vagas limitadas, avisamos você primeiro.",
  keywords: [
    "Lipe Alive",
    "Lipe Ensina",
    "mentoria",
    "posicionamento digital",
    "criação de conteúdo",
    "Luis Felipe Lima",
  ],
  openGraph: {
    title: "Lista de espera · Mentoria Lipe Ensina",
    description:
      "Posicionamento digital, produção de conteúdo e visibilidade nas redes. Entre na fila e seja avisado antes de todo mundo.",
    url: siteUrl,
    siteName: "Lipe Ensina",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lista de espera · Mentoria Lipe Ensina",
    description:
      "Posicionamento digital, produção de conteúdo e visibilidade nas redes. Vagas limitadas.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07070A",
  width: "device-width",
  initialScale: 1,
  // Deixa a pessoa dar zoom — acessibilidade acima do "app-like".
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="antialiased">
        {/* Sem JS as animações de entrada nunca disparam — o conteúdo
            precisa aparecer do mesmo jeito. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
