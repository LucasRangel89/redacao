import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://redacao-nota-maxima.app"),
  title: {
    default: "Redação Nota Máxima AI — Planejamento guiado com IA",
    template: "%s · Redação Nota Máxima AI",
  },
  description:
    "Plataforma inteligente de auxílio à escrita que guia estudantes desde o planejamento estrutural até a revisão técnica profunda de redações dissertativo-argumentativas (ENEM/Concursos).",
  keywords: [
    "redação",
    "ENEM",
    "IA generativa",
    "educação",
    "EdTech",
    "escrita assistida",
    "revisão de texto",
    "concurso público",
    "vestibular",
    "dissertativo argumentativo",
  ],
  authors: [{ name: "Redação Nota Máxima" }],
  creator: "Redação Nota Máxima AI",
  openGraph: {
    title: "Redação Nota Máxima AI",
    description:
      "Vencendo a página em branco: planejamento estruturado e feedback especializado em tempo real.",
    type: "website",
    locale: "pt_BR",
    siteName: "Redação Nota Máxima AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Redação Nota Máxima AI",
    description:
      "Planejamento guiado e revisão de redações ENEM com IA Generativa.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body
        className="antialiased bg-background text-foreground min-h-screen font-sans"
      >
        {children}
        <Toaster richColors position="top-center" theme="dark" closeButton />
      </body>
    </html>
  );
}
