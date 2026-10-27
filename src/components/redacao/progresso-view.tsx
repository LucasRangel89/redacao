"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  PenLine,
  Trash2,
  TrendingUp,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRedacaoStore, type RedacaoSalva } from "@/lib/store";
import { CHECKLIST } from "@/data/guia";
import { cn } from "@/lib/utils";

function formatarData(ts: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatarTempo(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function ProgressoView() {
  const {
    historico,
    carregarDoHistorico,
    removerDoHistorico,
    limparHistorico,
    setView,
    setStage,
    salvarNoHistorico,
    textoFinal,
    checklist,
    favoritos,
  } = useRedacaoStore();
  const [confirmar, setConfirmar] = useState<{ tipo: "item" | "tudo"; id?: string } | null>(null);

  const resumo = useMemo(() => {
    const totalPalavras = historico.reduce((acc, h) => acc + h.palavras, 0);
    const media = historico.length ? Math.round(totalPalavras / historico.length) : 0;
    const tempoTotal = historico.reduce((acc, h) => acc + h.tempoSegundos, 0);
    const comNota = historico.filter((h) => h.notaEstimada !== undefined);
    const ultimaNota = comNota[0]?.notaEstimada ?? null;
    const melhorNota = comNota.length
      ? Math.max(...comNota.map((h) => h.notaEstimada ?? 0))
      : null;
    return { totalPalavras, media, tempoTotal, ultimaNota, melhorNota };
  }, [historico]);

  const serie = useMemo(
    () => [...historico].reverse().slice(-8),
    [historico]
  );
  const maiorPalavras = Math.max(1, ...serie.map((h) => h.palavras));
  const ALTURA_BARRA = 140; // px — altura percentual não resolve dentro de flex
  const alturaBarra = (valor: number, maximo: number) =>
    `${Math.max(4, Math.round((valor / maximo) * ALTURA_BARRA))}px`;
  const itensChecklist = checklist.filter((c) => !c.startsWith("treino-")).length;

  function baixar(item: RedacaoSalva) {
    const nome = (item.titulo || "redacao")
      .slice(0, 60)
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    const blob = new Blob(
      [
        `Tema: ${item.titulo}\nSalvo em: ${formatarData(item.criadoEm)}\n` +
          `Palavras: ${item.palavras} · Linhas: ${item.linhas} · Parágrafos: ${item.paragrafos}\n\n`,
        item.texto,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome || "redacao"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Versão exportada em .txt.");
  }

  function salvarRascunho() {
    const id = salvarNoHistorico();
    if (!id) {
      toast.error("Escreva ao menos um parágrafo antes de salvar uma versão.");
      return;
    }
    toast.success("Rascunho atual salvo no histórico.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
          <TrendingUp className="mr-1 h-3 w-3" /> Histórico local · sem login
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Meu progresso</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          As versões que você salva ficam neste navegador. Compare a evolução do número
          de palavras, das estimativas de nota e do tempo de escrita. Nada é enviado a
          servidores.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={FileText} label="Versões salvas" value={String(historico.length)} />
        <Metric icon={PenLine} label="Palavras no total" value={String(resumo.totalPalavras)} hint={`média ${resumo.media} por texto`} />
        <Metric
          icon={BarChart3}
          label="Melhor estimativa"
          value={resumo.melhorNota !== null ? String(resumo.melhorNota) : "—"}
          hint={resumo.ultimaNota !== null ? `última: ${resumo.ultimaNota}/1000` : "rode um diagnóstico"}
        />
        <Metric
          icon={CheckCircle2}
          label="Checklist ENEM"
          value={`${itensChecklist}/${CHECKLIST.length}`}
          hint={`${favoritos.length} favoritos na biblioteca`}
        />
      </div>

      {/* Gráfico */}
      {serie.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução das últimas versões</CardTitle>
            <CardDescription>
              Barras azuis = palavras escritas · barras verdes = estimativa de nota (0–1000), quando houver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end justify-center gap-3 overflow-x-auto pb-1">
              {serie.map((h, i) => (
                <div key={h.id} className="flex min-w-12 max-w-20 flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-blue-500/60 transition-all hover:bg-blue-400"
                      style={{ height: alturaBarra(h.palavras, maiorPalavras) }}
                      title={`${h.palavras} palavras`}
                    />
                    {h.notaEstimada !== undefined && (
                      <div
                        className="w-1/2 rounded-t bg-emerald-500/50 transition-all hover:bg-emerald-400"
                        style={{ height: alturaBarra(h.notaEstimada, 1000) }}
                        title={`Nota estimada: ${h.notaEstimada}/1000`}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    #{historico.length - serie.length + i + 1}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-blue-500/60" /> Palavras (máx. {maiorPalavras})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-500/50" /> Nota estimada
              </span>
              <span>Tempo total de escrita: {formatarTempo(resumo.tempoTotal)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Ainda não há versões salvas</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Escreva no Estúdio e clique em “Salvar versão” (ou rode um Diagnóstico) para
              começar a acompanhar sua evolução.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => { setView("estudio"); setStage("escrita"); }}>
                <PenLine className="mr-1 h-3.5 w-3.5" /> Ir para o editor
              </Button>
              {textoFinal.trim().length > 20 && (
                <Button size="sm" variant="outline" onClick={salvarRascunho}>
                  Salvar rascunho atual
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {historico.length > 0 && (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Versões salvas</CardTitle>
              <CardDescription>
                Abrir uma versão substitui o rascunho atual — salve-o antes se quiser guardá-lo.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {textoFinal.trim().length > 20 && (
                <Button size="sm" variant="outline" onClick={salvarRascunho}>
                  Salvar rascunho atual
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmar({ tipo: "tudo" })}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar tudo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {historico.map((h, i) => (
              <div
                key={h.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/20 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-blue-300">
                  #{historico.length - i}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{h.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatarData(h.criadoEm)} · {h.area}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{h.palavras} palavras</Badge>
                    <Badge variant="secondary" className="text-[10px]">{h.linhas} linhas</Badge>
                    <Badge variant="secondary" className="text-[10px]">{h.paragrafos} parágrafos</Badge>
                    <Badge variant="secondary" className="text-[10px]">{formatarTempo(h.tempoSegundos)}</Badge>
                    {h.notaEstimada !== undefined && (
                      <Badge className="bg-emerald-500/15 text-[10px] text-emerald-300 hover:bg-emerald-500/15">
                        {h.notaEstimada}/1000 (estimativa)
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <Button size="xs" variant="outline" onClick={() => carregarDoHistorico(h.id)}>
                    Abrir <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => baixar(h)} aria-label="Baixar .txt">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmar({ tipo: "item", id: h.id })}
                    aria-label="Excluir versão"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <BookOpen className="h-5 w-5 shrink-0 text-blue-300" />
          <p className="flex-1 text-xs text-muted-foreground">
            Quer comparar sua escrita com bons exemplos? A Biblioteca traz redações modelo
            anotadas por parágrafo e um botão para importar a estrutura para o seu plano.
          </p>
          <Button size="sm" variant="outline" onClick={() => setView("biblioteca")}>
            Abrir Biblioteca <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(confirmar)} onOpenChange={(open) => !open && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmar?.tipo === "tudo" ? "Apagar todo o histórico?" : "Excluir esta versão?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar?.tipo === "tudo"
                ? "Todas as versões salvas neste navegador serão removidas. O rascunho atual não é afetado."
                : "A versão será removida do histórico. Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (confirmar?.tipo === "tudo") limparHistorico();
                else if (confirmar?.id) removerDoHistorico(confirmar.id);
                setConfirmar(null);
                toast.success("Histórico atualizado.");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-blue-300")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
          {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
