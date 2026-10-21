"use client";

import { useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BrainCircuit,
  FlaskConical,
  Lightbulb,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRedacaoStore, novoArgumento } from "@/lib/store";
import type { ArquiteturaSugestao, IntervencaoSugestao, RepertorioSugestao } from "@/lib/types";
import { TIPOS_REPERTORIO } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONECTIVOS_LISTA: Record<string, string[]> = {
  Oposição: ["por outro lado", "embora", "no entanto", "entretanto", "apesar de"],
  Adição: ["além disso", "ademais", "noutro viés", "somado a isso"],
  Causalidade: ["porquanto", "visto que", "devido ao fato de que", "uma vez que"],
  Conclusão: ["portanto", "logo", "em suma", "sendo assim", "dessa forma"],
};

export function ArquiteturaStage() {
  const {
    tema,
    tese,
    setTese,
    argumentos,
    addArgumento,
    updateArgumento,
    removeArgumento,
    intervencao,
    updateIntervencao,
    setStage,
  } = useRedacaoStore();

  const [gerandoArq, setGerandoArq] = useState(false);
  const [sugestao, setSugestao] = useState<ArquiteturaSugestao | null>(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const [tipoRep, setTipoRep] = useState<string>("filosofico");
  const [repAberto, setRepAberto] = useState(false);
  const [gerandoRep, setGerandoRep] = useState(false);
  const [reps, setReps] = useState<RepertorioSugestao[]>([]);
  const [repAlvo, setRepAlvo] = useState<string | null>(null);

  const [gerandoInt, setGerandoInt] = useState(false);
  const [sugInt, setSugInt] = useState<IntervencaoSugestao | null>(null);
  const [intAberta, setIntAberta] = useState(false);

  if (!tema) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Defina um tema na Etapa 1 antes de arquitetar o texto.
      </div>
    );
  }

  async function gerarArquitetura() {
    setGerandoArq(true);
    try {
      const res = await fetch("/api/arquitetura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: tema!.titulo, teseAtual: tese }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao gerar arquitetura");
      setSugestao(data as ArquiteturaSugestao);
      setDialogoAberto(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar arquitetura.");
    } finally {
      setGerandoArq(false);
    }
  }

  function aplicarSugestao() {
    if (!sugestao) return;
    setTese(sugestao.tese);
    useRedacaoStore.setState({
      argumentos: sugestao.argumentos.slice(0, 3).map((a) => ({
        ...novoArgumento(),
        topicoFrasal: a.topicoFrasal,
        repertorio: a.repertorio,
        analise: a.analise,
      })),
    });
    setDialogoAberto(false);
    toast.success("Arquitetura aplicada! Ajuste com suas próprias palavras.");
  }

  async function buscarRepertorios(idArgumento: string) {
    setRepAlvo(idArgumento);
    setRepAberto(true);
    setGerandoRep(true);
    setReps([]);
    try {
      const res = await fetch("/api/repertorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: tema!.titulo, tipo: tipoRep }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro");
      setReps(data.sugestoes as RepertorioSugestao[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao buscar repertórios.");
      setRepAberto(false);
    } finally {
      setGerandoRep(false);
    }
  }

  function aplicarRepertorio(r: RepertorioSugestao) {
    if (repAlvo) {
      updateArgumento(repAlvo, {
        repertorio: `${r.titulo} (${r.fonte}) — ${r.ideiaCentral}`,
      });
    }
    setRepAberto(false);
    toast.success("Repertório inserido no argumento.");
  }

  async function gerarIntervencao() {
    setGerandoInt(true);
    try {
      const res = await fetch("/api/intervencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema: tema!.titulo,
          problema: argumentos[0]?.topicoFrasal ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro");
      setSugInt(data as IntervencaoSugestao);
      setIntAberta(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar proposta.");
    } finally {
      setGerandoInt(false);
    }
  }

  function aplicarIntervencao() {
    if (!sugInt) return;
    updateIntervencao({
      agente: sugInt.agente,
      acao: sugInt.acao,
      meio: sugInt.meio,
      finalidade: sugInt.finalidade,
      detalhamento: sugInt.detalhamento,
    });
    setIntAberta(false);
    toast.success("5 elementos preenchidos — revise e personalize.");
  }

  function irParaEscrita() {
    if (!tese.trim()) {
      toast.error("Defina a tese central antes de escrever.");
      return;
    }
    if (argumentos.length === 0) {
      toast.error("Adicione ao menos um argumento ao plano.");
      return;
    }
    setStage("escrita");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Tema atual */}
      <div className="rounded-xl border border-border bg-secondary/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Etapa 2 · Arquitetura do texto
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tema.titulo}</p>
      </div>

      {/* Tese */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              Tese central
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={gerarArquitetura}
              disabled={gerandoArq}
            >
              {gerandoArq ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
              )}
              Sugerir plano completo com IA
            </Button>
          </div>
          <CardDescription>
            1–2 frases que respondem diretamente ao enunciado. Toda a redação defenderá
            esta ideia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={tese}
            onChange={(e) => setTese(e.target.value)}
            placeholder="Ex.: A solução para X passa pela combinação entre [medida A] e [medida B], pois o problema decorre de [causa] e [causa]…"
            className="min-h-20 resize-none"
          />
        </CardContent>
      </Card>

      {/* Argumentos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ScrollText className="h-5 w-5 text-blue-400" />
            Arquitetura de argumentos
            <Badge variant="secondary" className="text-[10px]">
              {argumentos.length}/3
            </Badge>
          </h2>
          <Button size="sm" variant="secondary" onClick={addArgumento} disabled={argumentos.length >= 3}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar argumento
          </Button>
        </div>

        {argumentos.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Comece adicionando um argumento ou peça um plano completo à IA (botão na
              tese). Cada argumento é montado em 3 módulos: tópico frasal, repertório e
              análise.
            </CardContent>
          </Card>
        )}

        {argumentos.map((arg, i) => (
          <Card key={arg.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Argumento {i + 1}</CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeArgumento(arg.id)}
                  aria-label={`Remover argumento ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  1 · Tópico frasal — a afirmação que encerra a discussão
                </Label>
                <Input
                  value={arg.topicoFrasal}
                  onChange={(e) => updateArgumento(arg.id, { topicoFrasal: e.target.value })}
                  placeholder="Ex.: A desvalorização docente agrava a evasão escolar no Brasil."
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    2 · Repertório — específico e verificável
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-blue-400 hover:text-blue-300"
                    onClick={() => buscarRepertorios(arg.id)}
                  >
                    <Sparkles className="mr-1 h-3 w-3" /> Sugerir repertório
                  </Button>
                </div>
                <Textarea
                  value={arg.repertorio}
                  onChange={(e) => updateArgumento(arg.id, { repertorio: e.target.value })}
                  placeholder="Ex.: Dado do INEP/IBGE…; Lei nº…; obra de Paulo Freire…; caso histórico…"
                  className="min-h-16 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  3 · Análise — como o repertório prova o tópico
                </Label>
                <Textarea
                  value={arg.analise}
                  onChange={(e) => updateArgumento(arg.id, { analise: e.target.value })}
                  placeholder="Conecte causa e consequência: por que esse dado/obra confirma a afirmação e como se relaciona ao tema?"
                  className="min-h-16 resize-none"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Connectivos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookMarked className="h-4 w-4 text-blue-400" />
            Connectivos úteis (Competência 4)
          </CardTitle>
          <CardDescription className="text-xs">
            Use variação — a repetição do mesmo conectivo penaliza a coesão.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {Object.entries(CONECTIVOS_LISTA).map(([cat, lista]) => (
            <div key={cat} className="w-full sm:w-auto sm:flex-1 min-w-40">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                {cat}
              </p>
              <div className="flex flex-wrap gap-1">
                {lista.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {c.trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Proposta de intervenção */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5 text-emerald-400" />
                Proposta de intervenção (Competência 5)
              </CardTitle>
              <CardDescription className="mt-1">
                Os 5 elementos obrigatórios do ENEM — proposta sem todos eles perde nota.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={gerarIntervencao} disabled={gerandoInt}>
              {gerandoInt ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              )}
              Sugerir com IA
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["agente", "Agente — quem fará", "Poder público, Ministério da Educação, escolas…"],
              ["acao", "Ação — o que fará", "Ampliar, criar, reformular, fiscalizar…"],
              ["meio", "Meio/Modo — como fará", "Por meio de campanha, programa, parceria, lei…"],
              ["finalidade", "Finalidade — para que fará", "Com o objetivo de reduzir/mitigar/garantir…"],
              ["detalhamento", "Detalhamento — encadeamento", "…, garantindo que / o que permitirá que…"],
            ] as const
          ).map(([campo, rotulo, placeholder], idx) => (
            <div key={campo} className={cn("space-y-1.5", idx === 4 && "sm:col-span-2")}>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                <span className="mr-1 font-bold text-emerald-400">{idx + 1}.</span>
                {rotulo}
              </Label>
              <Input
                value={intervencao[campo]}
                onChange={(e) => updateIntervencao({ [campo]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-end pb-4">
        <Button size="lg" onClick={irParaEscrita}>
          Ir para a escrita <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Diálogo: plano completo */}
      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scroll-fino">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-blue-400" /> Plano arquitetado pela IA
            </DialogTitle>
            <DialogDescription>
              Peças de arquitetura — não parágrafos prontos. Ao aplicar, edite com suas
              palavras para manter a autoria.
            </DialogDescription>
          </DialogHeader>
          {sugestao && (
            <div className="space-y-4">
              {sugestao.aviso && (
                <p className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                  {sugestao.aviso}
                </p>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Tese
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{sugestao.tese}</p>
              </div>
              {sugestao.argumentos.map((a, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    Argumento {i + 1} — {a.topicoFrasal}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-blue-300">Repertório: </span>
                    {a.repertorio}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-blue-300">Análise: </span>
                    {a.analise}
                  </p>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDialogoAberto(false)}>
                  Fechar
                </Button>
                <Button onClick={aplicarSugestao}>Aplicar ao plano</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo: repertórios */}
      <Dialog open={repAberto} onOpenChange={setRepAberto}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto scroll-fino">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" /> Bancos de repertório produtivo
            </DialogTitle>
            <DialogDescription>
              Sugestões verificáveis — confira a fonte antes de citar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5 py-1">
            {TIPOS_REPERTORIO.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipoRep(t.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  tipoRep === t.value
                    ? "border-primary bg-primary/20 text-blue-200"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => repAlvo && buscarRepertorios(repAlvo)}
            disabled={gerandoRep}
          >
            {gerandoRep ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Buscar {TIPOS_REPERTORIO.find((t) => t.value === tipoRep)?.label.toLowerCase()}
          </Button>
          <div className="space-y-2">
            {reps.map((r, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                <p className="text-sm font-medium">{r.titulo}</p>
                <p className="text-[11px] font-semibold text-blue-300">{r.fonte}</p>
                <p className="text-xs text-muted-foreground">{r.ideiaCentral}</p>
                <p className="text-xs italic text-muted-foreground">→ {r.comoUsar}</p>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => aplicarRepertorio(r)}>
                    Inserir no argumento
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo: intervenção */}
      <Dialog open={intAberta} onOpenChange={setIntAberta}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scroll-fino">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-400" /> Proposta estruturada
            </DialogTitle>
            <DialogDescription>
              Elementos sugeridos + esqueleto para você redigir com suas palavras.
            </DialogDescription>
          </DialogHeader>
          {sugInt && (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["Agente", sugInt.agente],
                    ["Ação", sugInt.acao],
                    ["Meio", sugInt.meio],
                    ["Finalidade", sugInt.finalidade],
                    ["Detalhamento", sugInt.detalhamento],
                  ] as const
                ).map(([rotulo, valor]) => (
                  <div key={rotulo} className="rounded-lg border border-border p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      {rotulo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{valor}</p>
                  </div>
                ))}
              </div>
              {sugInt.esqueletoParagrafo && (
                <p className="rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs italic text-muted-foreground">
                  {sugInt.esqueletoParagrafo}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setIntAberta(false)}>
                  Fechar
                </Button>
                <Button onClick={aplicarIntervencao}>Preencher os 5 campos</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
