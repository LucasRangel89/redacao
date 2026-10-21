"use client";

import { PenLine } from "lucide-react";
import { AppHeader } from "@/components/redacao/app-header";
import { SetupStage } from "@/components/redacao/setup-stage";
import { ArquiteturaStage } from "@/components/redacao/arquitetura-stage";
import { EscritaStage } from "@/components/redacao/escrita-stage";
import { useHydrated, useRedacaoStore } from "@/lib/store";
import { useEffect } from "react";

export default function Home() {
  const montado = useHydrated();
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

  // Auto-save está implícito via persistência do Zustand em localStorage.
  // O header marca "salvo" sempre que o store muda.

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
            {" "}{tema ? `· ${palavrasResumo(textoFinal)}` : "— a IA guia e questiona, a autoria é sua."}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            Next.js · React 19 · IA Generativa com arquitetura de modelos híbrida
          </p>
        </div>
      </footer>
    </div>
  );
}

function palavrasResumo(texto: string): string {
  const p = texto.trim().split(/\s+/).filter(Boolean).length;
  return p > 0 ? `${p} palavras escritas` : "a IA guia e questiona, a autoria é sua.";
}
