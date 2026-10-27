"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  FileJson,
  FileText,
  GraduationCap,
  Lightbulb,
  PenLine,
  Quote,
  Sparkles,
  Timer,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRedacaoStore } from "@/lib/store";
import { detectarModo, EVENTO_MODO_LOCAL, STATIC_MODE } from "@/lib/api";
import { acervo } from "@/lib/recursos";
import { CHECKLIST } from "@/data/guia";

export function DashboardView() {
  const {
    setView,
    setStage,
    irParaBiblioteca,
    tema,
    textoFinal,
    historico,
    checklist,
    favoritos,
  } = useRedacaoStore();
  const [modo, setModo] = useState<{ modo: "ia" | "local"; gemini: boolean }>({
    modo: STATIC_MODE ? "local" : "ia",
    gemini: false,
  });
  const [carregandoModo, setCarregandoModo] = useState(true);

  useEffect(() => {
    let ativo = true;
    detectarModo()
      .then((r) => {
        if (ativo) setModo({ modo: r.modo, gemini: r.gemini });
      })
      .finally(() => {
        if (ativo) setCarregandoModo(false);
      });
    const aoCairNoLocal = () => setModo({ modo: "local", gemini: false });
    window.addEventListener(EVENTO_MODO_LOCAL, aoCairNoLocal);
    return () => {
      ativo = false;
      window.removeEventListener(EVENTO_MODO_LOCAL, aoCairNoLocal);
    };
  }, []);

  const stats = useMemo(() => {
    const palavras = historico.reduce((acc, h) => acc + h.palavras, 0);
    const comNota = historico.filter((h) => h.notaEstimada !== undefined);
    const melhorNota = comNota.length
      ? Math.max(...comNota.map((h) => h.notaEstimada ?? 0))
      : null;
    return { palavras, melhorNota };
  }, [historico]);

  const progressoChecklist = Math.round((checklist.filter((c) => !c.startsWith("treino-")).length / CHECKLIST.length) * 100);

  function abrirEstudio(stage: "setup" | "arquitetura" | "escrita" = "setup") {
    if (stage === "escrita" && (!tema || !textoFinal.trim())) {
      setView("estudio");
      setStage("setup");
      return;
    }
    setView("estudio");
    setStage(stage);
  }

  const acoes = [
    {
      titulo: "Escolher um tema",
      descricao: "Gerar com IA ou sortear do acervo",
      icon: Lightbulb,
      onClick: () => abrirEstudio("setup"),
    },
    {
      titulo: "Arquitetar argumentos",
      descricao: "Tese, repertório e análise",
      icon: BrainCircuit,
      onClick: () => abrirEstudio("arquitetura"),
    },
    {
      titulo: "Banco de citações",
      descricao: `${acervo.totalCitacoes} repertórios prontos para usar`,
      icon: Quote,
      onClick: () => irParaBiblioteca(),
    },
    {
      titulo: "Checklist ENEM",
      descricao: `${CHECKLIST.length} itens antes de entregar`,
      icon: ClipboardCheck,
      onClick: () => setView("guia"),
    },
    {
      titulo: "Diagnóstico do texto",
      descricao: "Revisão rápida ou pelas 5 competências",
      icon: Sparkles,
      onClick: () => abrirEstudio("escrita"),
    },
    {
      titulo: "Meus dados",
      descricao: "Baixar backup e levar para outro aparelho",
      icon: FileJson,
      onClick: () => setView("progresso"),
    },
    {
      titulo: "Meu progresso",
      descricao: "Versões salvas e evolução",
      icon: TrendingUp,
      onClick: () => setView("progresso"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-950/60 via-card to-card p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative space-y-4">
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
            <Sparkles className="mr-1 h-3 w-3" /> Plataforma de treino de redação ENEM
          </Badge>
          <h1 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
            Da escolha do tema à{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              folha de correção
            </span>
            , em um só lugar.
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Planeje com um método (scaffolding), escreva com autoria e revise com
            feedback. Navegue pelo acervo de redações, pelo guia das 5 competências e
            pelo seu histórico — sem perder o fio do texto.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => abrirEstudio("setup")}>
              <PenLine className="mr-2 h-4 w-4" /> Começar uma redação
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => irParaBiblioteca()}>
              <BookOpen className="mr-2 h-4 w-4" /> Explorar biblioteca
            </Button>
          </div>
        </div>
      </section>

      {/* Status do ambiente */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {modo.modo === "ia" ? (
                <Wifi className="h-4 w-4 text-emerald-400" />
              ) : (
                <CloudOff className="h-4 w-4 text-amber-400" />
              )}
              {carregandoModo
                ? "Verificando ambiente…"
                : modo.modo === "ia"
                  ? "Servidor de IA conectado"
                  : "Modo local (sem servidor)"}
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {modo.modo === "ia"
                ? `As ferramentas usam ${modo.gemini ? "Google Gemini" : "o provedor embutido"}. Se a IA falhar, o acervo local assume automaticamente.`
                : "Publicação estática (como GitHub Pages): temas, repertórios, mentor e diagnóstico funcionam 100% no navegador com o acervo do projeto. Para correção por IA, faça deploy em um host com Node e configure GEMINI_API_KEY."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="secondary">{acervo.totalTemas} temas</Badge>
              <Badge variant="secondary">{acervo.totalRedacoes} redações modelo</Badge>
              <Badge variant="secondary">{acervo.totalCitacoes} citações</Badge>
              <Badge variant="secondary">0 configuração necessária</Badge>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          icon={FileText}
          label="Redações salvas"
          value={String(historico.length)}
          hint="no seu navegador"
        />
        <MetricCard
          icon={TrendingUp}
          label="Palavras escritas"
          value={String(stats.palavras + (textoFinal.trim() ? textoFinal.trim().split(/\s+/).length : 0))}
          hint={stats.melhorNota ? `melhor nota local: ${stats.melhorNota}/1000` : "incluindo o rascunho atual"}
        />
      </section>

      {/* Continue de onde parou */}
      {tema && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
              <PenLine className="h-5 w-5 text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                Rascunho em andamento
              </p>
              <p className="line-clamp-1 text-sm font-medium">{tema.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {textoFinal.trim()
                  ? `${textoFinal.trim().split(/\s+/).length} palavras escritas · salvo automaticamente`
                  : "Tema definido — falta arquitetar e escrever"}
              </p>
            </div>
            <Button size="sm" onClick={() => abrirEstudio(textoFinal.trim() ? "escrita" : "arquitetura")}>
              Continuar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ações rápidas */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">Por onde quer começar?</h2>
          <span className="text-xs text-muted-foreground">{acoes.length} atalhos</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {acoes.map((acao) => {
            const Icon = acao.icon;
            return (
              <button
                key={acao.titulo}
                type="button"
                onClick={acao.onClick}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-secondary/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-blue-300 group-hover:bg-primary/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{acao.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{acao.descricao}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Método + progresso */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-blue-400" /> O método em 3 etapas
            </CardTitle>
            <CardDescription>
              A IA guia e questiona; a autoria continua sendo sua.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { n: "1", t: "Tema", d: "Escolha um tema gerado por IA, do acervo ou da sua prova." },
              { n: "2", t: "Arquitetura", d: "Defina tese, tópicos frasais, repertórios e os 5 elementos da intervenção." },
              { n: "3", t: "Escrita", d: "Escreva na folha de prova, use o mentor e rode o diagnóstico antes de entregar." },
            ].map((passo) => (
              <div key={passo.n} className="flex gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-blue-300">
                  {passo.n}
                </span>
                <div>
                  <p className="text-sm font-semibold">{passo.t}</p>
                  <p className="text-xs text-muted-foreground">{passo.d}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setView("guia")}>
              <BookMarked className="mr-2 h-4 w-4" /> Ver guia completo das competências
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Seu treino
            </CardTitle>
            <CardDescription>Tudo salvo localmente, sem login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Checklist ENEM</span>
                <span className="font-semibold tabular-nums">{progressoChecklist}%</span>
              </div>
              <Progress value={progressoChecklist} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-xl font-bold tabular-nums">{favoritos.length}</p>
                <p className="text-[11px] text-muted-foreground">itens favoritos</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-xl font-bold tabular-nums">{historico.length}</p>
                <p className="text-[11px] text-muted-foreground">versões salvas</p>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              <Timer className="mr-1 inline h-3.5 w-3.5 text-blue-400" />
              Dica: ative o <strong>Modo prova</strong> no editor e treine com 60 minutos
              cronometrados antes de salvar uma versão.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
