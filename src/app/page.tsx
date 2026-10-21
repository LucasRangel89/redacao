"use client";

import { useEffect } from "react";
import { PenLine } from "lucide-react";
import { AppHeader } from "@/components/redacao/app-header";
import { SetupStage } from "@/components/redacao/setup-stage";
import { ArquiteturaStage } from "@/components/redacao/arquitetura-stage";
import { EscritaStage } from "@/components/redacao/escrita-stage";
import { useHydrated, useRedacaoStore } from "@/lib/store";

export default function Home() {
  const montado = useHydrated();
  const stage = useRedacaoStore((s) => s.stage);
  const iniciarSessao = useRedacaoStore((s) => s.iniciarSessao);

  // Registra o início da sessão (KPI de tempo de planejamento)
  useEffect(() => {
    iniciarSessao();
  }, [iniciarSessao]);

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
        {stage === "setup" && <SetupStage />}
        {stage === "arquitetura" && <ArquiteturaStage />}
        {stage === "escrita" && <EscritaStage />}
      </main>

      <footer className="mt-auto border-t border-border/60 bg-background/60">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-1 px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PenLine className="h-3 w-3 text-blue-400" />
            <span className="font-medium text-foreground/80">Redação Nota Máxima AI</span>
            — a IA guia e questiona, a autoria é sua.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Next.js · React 19 · IA Generativa com arquitetura de modelos híbrida
          </p>
        </div>
      </footer>
    </div>
  );
}
