import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Redação Nota Máxima AI — Planejamento guiado com IA Generativa",
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
  ],
  authors: [{ name: "Redação Nota Máxima" }],
  openGraph: {
    title: "Redação Nota Máxima AI",
    description:
      "Vencendo a página em branco: planejamento estruturado e feedback especializado em tempo real.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster richColors position="top-center" theme="dark" />
      </body>
    </html>
  );
}
