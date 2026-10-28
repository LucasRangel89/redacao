"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  GraduationCap,
  Lightbulb,
  ListChecks,
  PenLine,
  RotateCcw,
  Sparkles,
  Target,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRedacaoStore } from "@/lib/store";
import {
  CHECKLIST,
  COMPETENCIAS,
  CONECTIVOS,
  ERROS_COMUNS,
  ESTRUTURA,
  INTERVENCAO_5,
  PLANO_TREINO,
} from "@/data/guia";
import { intervencaoLocal } from "@/lib/local-ai";
import { listarRegras, ORDEM_CATEGORIAS, REGRAS, ROTULO_CATEGORIA } from "@/lib/analise-texto";
import { acervo } from "@/lib/recursos";
import { cn } from "@/lib/utils";

const CORES: Record<string, string> = {
  sky: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  violet: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  blue: "text-blue-300 border-blue-500/30 bg-blue-500/10",
  cyan: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
};

const ABAS_GUIA = [
  "competencias", "estrutura", "intervencao", "conectivos",
  "checklist", "treino", "erros", "revisao",
];

/** Catálogo de regras do diagnóstico local, agrupado para estudo (P1.2). */
const REGRAS_AGRUPADAS = ORDEM_CATEGORIAS.map((categoria) => ({
  categoria,
  rotulo: ROTULO_CATEGORIA[categoria],
  regras: listarRegras().filter((r) => r.categoria === categoria),
})).filter((g) => g.regras.length > 0);

export function GuiaView() {
  const {
    checklist,
    toggleChecklist,
    resetChecklist,
    setView,
    setStage,
    tema,
    updateIntervencao,
    guiaAba,
    setGuiaAba,
  } = useRedacaoStore();
  const abaAtiva = ABAS_GUIA.includes(guiaAba) ? guiaAba : "competencias";
  const [esqueleto, setEsqueleto] = useState<string | null>(null);

  const marcados = checklist.filter((c) => !c.startsWith("treino-")).length;
  const progresso = Math.round((marcados / CHECKLIST.length) * 100);
  const treinoFeito = useMemo(
    () => PLANO_TREINO.filter((_, i) => checklist.includes(`treino-${i}`)).length,
    [checklist]
  );

  function copiar(texto: string, mensagem = "Copiado!") {
    navigator.clipboard.writeText(texto).then(
      () => toast.success(mensagem),
      () => toast.error("Não foi possível copiar.")
    );
  }

  function gerarEsqueleto() {
    const sugestao = intervencaoLocal(tema?.titulo ?? "o tema da sua redação");
    updateIntervencao({
      agente: sugestao.agente,
      acao: sugestao.acao,
      meio: sugestao.meio,
      finalidade: sugestao.finalidade,
      detalhamento: sugestao.detalhamento,
    });
    setEsqueleto(sugestao.esqueletoParagrafo);
    toast.success("Esqueleto gerado e preenchido no seu plano.", {
      description: "Vá para a Arquitetura e reescreva com as suas palavras.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
          <GraduationCap className="mr-1 h-3 w-3" /> Referência rápida, sem IA
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Guia ENEM</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          As 5 competências, a estrutura de cada parágrafo, a fórmula da intervenção,
          conectivos e um checklist interativo. Tudo salvo no seu navegador — consulte
          enquanto escreve.
        </p>
      </div>

      <Tabs value={abaAtiva} onValueChange={setGuiaAba}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="competencias" className="text-xs">Competências</TabsTrigger>
          <TabsTrigger value="estrutura" className="text-xs">Estrutura</TabsTrigger>
          <TabsTrigger value="intervencao" className="text-xs">Intervenção</TabsTrigger>
          <TabsTrigger value="conectivos" className="text-xs">Conectivos</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs">
            Checklist ({marcados}/{CHECKLIST.length})
          </TabsTrigger>
          <TabsTrigger value="treino" className="text-xs">Plano de 7 dias</TabsTrigger>
          <TabsTrigger value="erros" className="text-xs">Erros comuns</TabsTrigger>
          <TabsTrigger value="revisao" className="text-xs">
            Revisão local ({REGRAS.length})
          </TabsTrigger>
        </TabsList>

        {/* COMPETÊNCIAS */}
        <TabsContent value="competencias" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {COMPETENCIAS.map((c) => (
              <Card key={c.codigo} className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("font-mono text-xs", CORES[c.cor])}>
                      {c.codigo}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">até 200 pontos</span>
                  </div>
                  <CardTitle className="text-sm">{c.nome}</CardTitle>
                  <CardDescription className="text-xs">{c.resumo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  <div>
                    <p className="mb-1 flex items-center gap-1 font-semibold text-emerald-300">
                      <Check className="h-3 w-3" /> Como garantir
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                      {c.comoGarantir.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-amber-300">Erros que derrubam a nota</p>
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                      {c.errosComuns.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ESTRUTURA */}
        <TabsContent value="estrutura" className="mt-4 space-y-3">
          <div className="grid gap-3 lg:grid-cols-3">
            {ESTRUTURA.map((e, i) => (
              <Card key={e.etapa} className="h-full">
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit text-[10px]">
                    Bloco {i + 1} de 3
                  </Badge>
                  <CardTitle className="text-sm">{e.etapa}</CardTitle>
                  <CardDescription className="text-xs">{e.objetivo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                    {e.passos.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ol>
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                      Esqueleto
                    </p>
                    <p className="text-xs italic leading-relaxed text-muted-foreground">
                      {e.modelo}
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    className="w-full"
                    onClick={() => copiar(e.modelo, "Esqueleto copiado.")}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copiar esqueleto
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <BookOpen className="h-5 w-5 shrink-0 text-blue-300" />
              <p className="flex-1 text-xs text-muted-foreground">
                Quer ver esses esqueletos aplicados? Abra uma das {acervo.totalRedacoes} redações
                modelo da Biblioteca com anotações parágrafo a parágrafo.
              </p>
              <Button size="sm" variant="outline" onClick={() => setView("biblioteca")}>
                Abrir biblioteca <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTERVENÇÃO */}
        <TabsContent value="intervencao" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-emerald-400" /> Os 5 elementos da Competência 5
              </CardTitle>
              <CardDescription>
                A proposta precisa ser completa, detalhada, articulada à tese e respeitar os
                direitos humanos. Falta de um elemento já reduz a nota.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {INTERVENCAO_5.map((item, i) => (
                <div key={item.nome} className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-semibold">
                    <span className="mr-1.5 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                      {i + 1}
                    </span>
                    {item.nome} <span className="font-normal text-muted-foreground">— {item.pergunta}</span>
                  </p>
                  <p className="mt-1 text-xs italic text-muted-foreground">“{item.exemplo}”</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Lightbulb className="h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">Gerar esqueleto para o meu tema</p>
                <p className="text-xs text-muted-foreground">
                  Preenche os 5 campos da Arquitetura com um ponto de partida adaptado a “
                  {tema?.titulo.slice(0, 70) ?? "tema livre"}”.
                </p>
              </div>
              <Button size="sm" onClick={gerarEsqueleto}>
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Gerar e preencher
              </Button>
            </CardContent>
          </Card>
          {esqueleto && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs italic leading-relaxed text-muted-foreground">{esqueleto}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copiar(esqueleto)}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setView("estudio");
                      setStage("arquitetura");
                    }}
                  >
                    Ir para a Arquitetura <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONECTIVOS */}
        <TabsContent value="conectivos" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CONECTIVOS.map((grupo) => (
              <Card key={grupo.categoria}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{grupo.categoria}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5 pt-0">
                  {grupo.itens.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => copiar(item, `“${item}” copiado.`)}
                      title="Clique para copiar"
                      className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CHECKLIST */}
        <TabsContent value="checklist" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-blue-400" /> Checklist antes de entregar
              </CardTitle>
              <CardDescription>
                Marque cada item conforme revisa seu texto. O progresso fica salvo neste
                navegador e aparece no Início.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {marcados} de {CHECKLIST.length} itens conferidos
                  </span>
                  <span className="font-semibold tabular-nums">{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CHECKLIST.map((item) => {
                  const marcado = checklist.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklist(item.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition-colors",
                        marcado
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-border bg-secondary/20 hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          marcado
                            ? "border-emerald-400 bg-emerald-500 text-white"
                            : "border-muted-foreground/50"
                        )}
                      >
                        {marcado && <Check className="h-3 w-3" />}
                      </span>
                      <span className="flex-1">{item.texto}</span>
                      <Badge variant="outline" className="shrink-0 text-[9px]">
                        {item.competencia}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setView("estudio");
                    setStage("escrita");
                  }}
                >
                  <PenLine className="mr-1 h-3.5 w-3.5" /> Revisar meu texto
                </Button>
                <Button size="sm" variant="ghost" onClick={resetChecklist}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpar marcações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANO DE TREINO */}
        <TabsContent value="treino" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plano de 7 dias</CardTitle>
              <CardDescription>
                Um foco por dia. Marque os concluídos: {treinoFeito}/{PLANO_TREINO.length}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(treinoFeito / PLANO_TREINO.length) * 100} className="h-2" />
              {PLANO_TREINO.map((dia, i) => {
                const feito = checklist.includes(`treino-${i}`);
                return (
                  <button
                    key={dia.dia}
                    type="button"
                    onClick={() => toggleChecklist(`treino-${i}`)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                      feito ? "border-emerald-500/30 bg-emerald-500/10" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        feito ? "border-emerald-400 bg-emerald-500 text-white" : "border-muted-foreground/50"
                      )}
                    >
                      {feito && <Check className="h-3 w-3" />}
                    </span>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {dia.dia}
                    </Badge>
                    <div>
                      <p className="text-xs font-semibold">{dia.foco}</p>
                      <p className="text-xs text-muted-foreground">{dia.tarefa}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ERROS COMUNS */}
        <TabsContent value="erros" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {ERROS_COMUNS.map((item) => (
              <Card key={item.erro}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-300">{item.erro}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-emerald-300">Como corrigir: </span>
                    {item.correcao}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* REVISÃO LOCAL — catálogo de regras com exemplos */}
        <TabsContent value="revisao" className="mt-4 space-y-5">
          <Card className="border-blue-500/25 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                O que o diagnóstico local verifica ({REGRAS.length} regras)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                São regras simples escritas à mão: funcionam no celular, no site do GitHub
                Pages e sem internet — nenhuma inteligência artificial é consultada. O
                Estúdio → Revisão mostra cada trecho encontrado no seu texto e uma sugestão
                de substituição.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[11px] leading-relaxed text-amber-300/90">
                Atenção: isto é um apoio didático, não uma correção oficial. As regras
                cobrem erros frequentes, mas não substituem a leitura atenta nem um
                corretor humano. As notas exibidas são estimativas, nunca notas oficiais.
              </p>
            </CardContent>
          </Card>

          {REGRAS_AGRUPADAS.map((grupo) => (
            <section key={grupo.categoria} className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {grupo.rotulo}
                <Badge variant="outline" className="text-[10px]">
                  {grupo.regras.length} {grupo.regras.length === 1 ? "regra" : "regras"}
                </Badge>
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {grupo.regras.map((regra) => (
                  <Card key={regra.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start justify-between gap-2 text-sm">
                        <span>{regra.nome}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {regra.id}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 pt-0">
                      <p className="text-[11px] leading-relaxed">
                        <span className="font-semibold text-destructive">Erro: </span>
                        <span className="text-muted-foreground">{regra.exemploErro}</span>
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        <span className="font-semibold text-emerald-400">Correção: </span>
                        <span className="text-muted-foreground">{regra.exemploCorrecao}</span>
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                        {regra.explicacao}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
