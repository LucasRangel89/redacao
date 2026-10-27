"use client";

import { useEffect } from "react";
import { PenLine } from "lucide-react";
import { AppHeader } from "@/components/redacao/app-header";
import { SetupStage } from "@/components/redacao/setup-stage";
import { ArquiteturaStage } from "@/components/redacao/arquitetura-stage";
import { EscritaStage } from "@/components/redacao/escrita-stage";
import { DashboardView } from "@/components/redacao/dashboard-view";
import { BibliotecaView } from "@/components/redacao/biblioteca-view";
import { GuiaView } from "@/components/redacao/guia-view";
import { ProgressoView } from "@/components/redacao/progresso-view";
import { useHydrated, useRedacaoStore, type View } from "@/lib/store";
import { acervo } from "@/lib/recursos";

const ATALHOS: Record<string, View> = {
  "1": "inicio",
  "2": "estudio",
  "3": "biblioteca",
  "4": "guia",
  "5": "progresso",
};

export default function Home() {
  const montado = useHydrated();
  const view = useRedacaoStore((s) => s.view);
  const setView = useRedacaoStore((s) => s.setView);
  const stage = useRedacaoStore((s) => s.stage);
  const textoFinal = useRedacaoStore((s) => s.textoFinal);
  const tema = useRedacaoStore((s) => s.tema);

  // Aviso antes de sair da página com texto não vazio
  useEffect(() => {
    const adverteSaida = (e: BeforeUnloadEvent) => {
      if (textoFinal.trim().length > 20) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", adverteSaida);
    return () => window.removeEventListener("beforeunload", adverteSaida);
  }, [textoFinal]);

  // Atalhos Alt+1..5 para navegar entre as seções.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const destino = ATALHOS[e.key];
      if (e.altKey && destino) {
        e.preventDefault();
        setView(destino);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setView]);

  if (!montado) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-72 rounded-lg bg-secondary/60" />
            <div className="h-4 w-full max-w-xl rounded bg-secondary/40" />
            <div className="h-40 w-full rounded-xl bg-secondary/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1">
        {view === "inicio" && <DashboardView />}
        {view === "biblioteca" && <BibliotecaView />}
        {view === "guia" && <GuiaView />}
        {view === "progresso" && <ProgressoView />}
        {view === "estudio" && (
          <>
            {stage === "setup" && <SetupStage />}
            {stage === "arquitetura" && <ArquiteturaStage />}
            {stage === "escrita" && <EscritaStage />}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-background/60 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PenLine className="h-3 w-3 text-blue-400" />
            <span className="font-medium text-foreground/80">Redação Nota Máxima AI</span>
            {" · "}
            {tema
              ? palavrasResumo(textoFinal)
              : "a IA guia e questiona; a autoria é sua."}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            {acervo.totalTemas} temas · {acervo.totalRedacoes} modelos · {acervo.totalCitacoes} citações
            {" · "}Atalhos: Alt+1..5
          </p>
        </div>
      </footer>
    </div>
  );
}

function palavrasResumo(texto: string): string {
  const p = texto.trim().split(/\s+/).filter(Boolean).length;
  return p > 0 ? `${p} palavras escritas` : "rascunho em andamento";
}
