"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChartNoAxesColumn,
  Check,
  GraduationCap,
  Home,
  PenLine,
  RotateCcw,
  Save,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useRedacaoStore, type View } from "@/lib/store";
import { detectarModo, EVENTO_MODO_LOCAL, STATIC_MODE } from "@/lib/api";
import type { Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV: { id: View; label: string; icon: typeof Home }[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "estudio", label: "Estúdio", icon: PenLine },
  { id: "biblioteca", label: "Biblioteca", icon: BookOpen },
  { id: "guia", label: "Guia ENEM", icon: GraduationCap },
  { id: "progresso", label: "Progresso", icon: ChartNoAxesColumn },
];

const ETAPAS: { id: Stage; numero: string; titulo: string; descricao: string }[] = [
  { id: "setup", numero: "1", titulo: "Tema", descricao: "Escolha do tema" },
  { id: "arquitetura", numero: "2", titulo: "Arquitetura", descricao: "Planejamento" },
  { id: "escrita", numero: "3", titulo: "Escrita", descricao: "Redação" },
];

function formatarTempo(segundos: number) {
  if (segundos < 0) segundos = 0;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function AppHeader() {
  const {
    view,
    setView,
    stage,
    setStage,
    tema,
    startedAt,
    novaRedacao,
    tese,
    argumentos,
    historico,
  } = useRedacaoStore();
  const [agora, setAgora] = useState(() => Date.now());
  const [salvo, setSalvo] = useState<"salvo" | "salvando">("salvo");
  const [modo, setModo] = useState<"ia" | "local">(STATIC_MODE ? "local" : "ia");
  const timerSalvo = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsed = startedAt
    ? Math.max(0, Math.floor((agora - startedAt) / 1000))
    : 0;

  useEffect(() => {
    let ativo = true;
    detectarModo().then((r) => {
      if (ativo) setModo(r.modo);
    });
    const aoCairNoLocal = () => setModo("local");
    window.addEventListener(EVENTO_MODO_LOCAL, aoCairNoLocal);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_MODO_LOCAL, aoCairNoLocal);
    };
  }, []);

  // Relógio: apenas o callback do intervalo atualiza estado.
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Indicador de salvamento: reage a mudanças do store via assinatura externa.
  useEffect(() => {
    const inscricao = useRedacaoStore.subscribe((estado, anterior) => {
      if (
        estado.textoFinal === anterior.textoFinal &&
        estado.tese === anterior.tese &&
        estado.argumentos === anterior.argumentos
      ) {
        return;
      }
      setSalvo("salvando");
      if (timerSalvo.current) clearTimeout(timerSalvo.current);
      timerSalvo.current = setTimeout(() => setSalvo("salvo"), 800);
    });
    return () => {
      inscricao();
      if (timerSalvo.current) clearTimeout(timerSalvo.current);
    };
  }, []);

  const podeIrPara = (destino: Stage): boolean => {
    if (destino === "setup") return true;
    if (!tema) return false;
    if (destino === "escrita") return tese.trim().length > 0 && argumentos.length > 0;
    return true;
  };

  const etapaAtual = ETAPAS.find((e) => e.id === stage);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo (volta ao início) */}
        <button
          type="button"
          onClick={() => setView("inicio")}
          className="flex items-center gap-2.5 min-w-0 text-left"
          aria-label="Ir para o início"
        >
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
              {view === "estudio" && etapaAtual
                ? `Etapa ${etapaAtual.numero} · ${etapaAtual.descricao}`
                : "Planeje. Escreva. Revise."}
            </p>
          </div>
        </button>

        {/* Navegação principal (desktop) */}
        <nav aria-label="Seções do aplicativo" className="hidden lg:flex items-center gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const ativo = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  ativo
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.id === "progresso" && historico.length > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-[10px] text-blue-300">
                    {historico.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status: modo, save, timer, reset */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "hidden sm:flex text-[10px] gap-1",
              modo === "ia"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            )}
            title={
              modo === "ia"
                ? "Servidor de IA conectado — se falhar, o modo local assume automaticamente."
                : "Sem servidor de IA: ferramentas usam o acervo local do projeto."
            }
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                modo === "ia" ? "bg-emerald-400" : "bg-amber-400"
              )}
            />
            {modo === "ia" ? "IA online" : "Modo local"}
          </Badge>

          {tema && (
            <div
              className="hidden xl:flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground"
              aria-live="polite"
              title="Salvamento automático em seu navegador"
            >
              {salvo === "salvo" ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Salvo
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 text-amber-400 animate-pulse" /> Salvando…
                </>
              )}
            </div>
          )}

          {startedAt && (
            <div
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-mono tabular-nums text-muted-foreground"
              title="Tempo total da sessão (desde a escolha do tema)"
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
                aria-label="Nova redação"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Começar uma nova redação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tema, arquitetura e todo o texto escrito serão apagados do rascunho
                  atual. As versões salvas em Progresso permanecem guardadas.
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

      {/* Navegação mobile + stepper do estúdio */}
      <div className="border-t border-border/50">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-1.5 scroll-fino lg:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            const ativo = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  ativo
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {view === "estudio" && (
          <nav
            aria-label="Etapas da redação"
            className="mx-auto hidden max-w-7xl items-center justify-center gap-1 px-4 py-2 md:flex"
          >
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
        )}
      </div>
    </header>
  );
}
