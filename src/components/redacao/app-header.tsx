"use client";

import { useEffect, useState } from "react";
import { PenLine, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRedacaoStore } from "@/lib/store";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const ETAPAS: { id: Stage; numero: string; titulo: string }[] = [
  { id: "setup", numero: "1", titulo: "Tema" },
  { id: "arquitetura", numero: "2", titulo: "Arquitetura" },
  { id: "escrita", numero: "3", titulo: "Escrita" },
];

function formatarTempo(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function AppHeader() {
  const { stage, setStage, tema, startedAt, novaRedacao } = useRedacaoStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const podeIrPara = (destino: Stage) => {
    if (destino === "setup") return true;
    if (!tema) return false;
    if (destino === "escrita") {
      return (
        useRedacaoStore.getState().tese.trim().length > 0 &&
        useRedacaoStore.getState().argumentos.length > 0
      );
    }
    return true;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <PenLine className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight tracking-tight">
              Redação Nota Máxima
              <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                AI
              </span>
            </p>
            <p className="hidden sm:block truncate text-xs text-muted-foreground leading-tight">
              Planeje. Escreva. Revisão em tempo real.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <nav aria-label="Etapas da redação" className="hidden md:flex items-center gap-1">
          {ETAPAS.map((etapa, i) => {
            const ativo = stage === etapa.id;
            const concluido = ETAPAS.findIndex((e) => e.id === stage) > i;
            const acessivel = podeIrPara(etapa.id);
            return (
              <div key={etapa.id} className="flex items-center">
                {i > 0 && (
                  <span
                    className={cn(
                      "mx-1 h-px w-8",
                      concluido || ativo ? "bg-primary/60" : "bg-border"
                    )}
                  />
                )}
                <button
                  type="button"
                  disabled={!acessivel}
                  onClick={() => setStage(etapa.id)}
                  aria-current={ativo ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    ativo
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : concluido
                        ? "text-blue-400 hover:bg-secondary"
                        : acessivel
                          ? "text-muted-foreground hover:bg-secondary"
                          : "text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
                      ativo
                        ? "border-primary-foreground/40 bg-primary-foreground/20"
                        : concluido
                          ? "border-blue-400/50 bg-blue-400/10"
                          : "border-border"
                    )}
                  >
                    {concluido ? "✓" : etapa.numero}
                  </span>
                  {etapa.titulo}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Timer + reset */}
        <div className="flex items-center gap-2">
          {startedAt && (
            <div
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-mono tabular-nums text-muted-foreground"
              title="Tempo total da sessão"
            >
              <Timer className="h-3.5 w-3.5 text-blue-400" />
              {formatarTempo(elapsed)}
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                title="Nova redação (limpar tudo)"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Começar uma nova redação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tema, arquitetura e todo o texto escrito serão apagados. Essa ação
                  não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={novaRedacao}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Limpar e recomeçar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
