"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookmarkPlus,
  ClipboardList,
  Copy,
  Download,
  Eye,
  EyeOff,
  Printer,
  Timer,
  TimerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidePanel } from "@/components/redacao/side-panel";
import { estatisticasTexto, useHydrated, useRedacaoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const META_LINHAS = 30;

export function EscritaStage() {
  const {
    tema,
    tese,
    argumentos,
    intervencao,
    textoFinal,
    setTextoFinal,
    salvarNoHistorico,
    provaAte,
    iniciarProva,
    encerrarProva,
  } = useRedacaoStore();
  const [planoVisivel, setPlanoVisivel] = useState(true);
  const [painelAberto, setPainelAberto] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const montado = useHydrated();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => estatisticasTexto(textoFinal), [textoFinal]);
  const progressoLinhas = Math.min(100, (stats.linhas / META_LINHAS) * 100);
  const segundosProva = provaAte ? Math.max(0, Math.ceil((provaAte - agora) / 1000)) : 0;
  const provaAtiva = Boolean(provaAte) && segundosProva > 0;

  useEffect(() => {
    if (!provaAte) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [provaAte]);

  const tempoProva = `${String(Math.floor(segundosProva / 60)).padStart(2, "0")}:${String(
    segundosProva % 60
  ).padStart(2, "0")}`;

  // Auto-resize do textarea conforme o conteúdo cresce
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 400)}px`;
  }, [textoFinal]);

  function copiarTexto() {
    if (!textoFinal.trim()) {
      toast.error("Escreva algo antes de copiar.");
      return;
    }
    navigator.clipboard.writeText(textoFinal).then(
      () => toast.success("Redação copiada para a área de transferência."),
      () => toast.error("Não foi possível copiar.")
    );
  }

  function baixarTxt() {
    if (!textoFinal.trim()) {
      toast.error("Escreva algo antes de exportar.");
      return;
    }
    const nome =
      (tema?.titulo ?? "redacao")
        .slice(0, 60)
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase() || "redacao";
    const blob = new Blob(
      [
        `Tema: ${tema?.titulo ?? ""}\n\n`,
        textoFinal,
        `\n\n---\nPalavras: ${stats.palavras} · Linhas: ${stats.linhas}/30 · Parágrafos: ${stats.paragrafos}`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo .txt gerado.");
  }

  function salvarVersao() {
    const id = salvarNoHistorico();
    if (!id) {
      toast.error("Escreva ao menos um parágrafo antes de salvar uma versão.");
      return;
    }
    toast.success("Versão salva no histórico.", {
      description: "Acompanhe sua evolução em Progresso.",
    });
  }

  function alternarProva() {
    if (provaAte) {
      encerrarProva();
      toast.info("Modo prova encerrado.");
    } else {
      iniciarProva(60);
      toast.success("Modo prova iniciado: 60 minutos no relógio.", {
        description: "Simule as condições reais do ENEM. Boa redação!",
      });
    }
  }

  function imprimir() {
    if (!textoFinal.trim()) {
      toast.error("Escreva algo antes de gerar o PDF.");
      return;
    }
    window.print();
  }

  // Atalho: Ctrl/Cmd+Enter foca o editor? Não — melhor Ctrl+S prevenido e feedback.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        toast.success("Progresso salvo localmente.");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Tema em destaque */}
      <div className="mb-4 rounded-xl border border-border bg-secondary/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          Tema
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{tema?.titulo}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ===== Coluna esquerda: plano + folha ===== */}
        <div className="min-w-0 space-y-4">
          {/* Plano da arquitetura (colapsável) */}
          {planoVisivel && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ClipboardList className="h-4 w-4 text-blue-400" />
                    Seu plano arquitetado
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setPlanoVisivel(false)}
                    aria-label="Ocultar plano"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p>
                  <span className="font-semibold text-amber-400">Tese: </span>
                  <span className="text-muted-foreground">{tese || "—"}</span>
                </p>
                {argumentos.map((a, i) => (
                  <p key={a.id}>
                    <span className="font-semibold text-blue-300">Argumento {i + 1}: </span>
                    <span className="text-muted-foreground">{a.topicoFrasal || "—"}</span>
                    {a.repertorio && (
                      <span className="text-muted-foreground/70"> · {a.repertorio}</span>
                    )}
                  </p>
                ))}
                {(intervencao.agente || intervencao.acao) && (
                  <p>
                    <span className="font-semibold text-emerald-400">Intervenção: </span>
                    <span className="text-muted-foreground">
                      {intervencao.agente || "…"} · {intervencao.acao || "…"} ·{" "}
                      {intervencao.meio || "…"} · {intervencao.finalidade || "…"}
                      {intervencao.detalhamento ? ` · ${intervencao.detalhamento}` : ""}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {!planoVisivel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setPlanoVisivel(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Mostrar plano
            </Button>
          )}

          {/* Estatísticas + ações */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground tabular-nums">{stats.palavras}</span>{" "}
                palavras
              </span>
              <span className="text-muted-foreground">
                <span className="font-bold text-foreground tabular-nums">
                  {stats.paragrafos}
                </span>{" "}
                parágrafos
              </span>
              <span className="flex flex-1 items-center gap-2 min-w-44">
                <span className="shrink-0 text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">
                    {stats.linhas}
                  </span>
                  /{META_LINHAS} linhas
                </span>
                <Progress
                  value={progressoLinhas}
                  className={cn(
                    "h-1.5 flex-1",
                    progressoLinhas >= 100 ? "[&>div]:bg-emerald-500" : ""
                  )}
                  aria-label="Progresso de linhas"
                />
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="xs" variant="outline" onClick={copiarTexto}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar texto
              </Button>
              <Button size="xs" variant="outline" onClick={baixarTxt}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar .txt
              </Button>
              <Button size="xs" variant="outline" onClick={imprimir}>
                <Printer className="mr-1.5 h-3.5 w-3.5" /> PDF / folha oficial
              </Button>
              <Button size="xs" variant="outline" onClick={salvarVersao}>
                <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" /> Salvar versão
              </Button>
              <Button
                size="xs"
                variant={provaAtiva ? "destructive" : "secondary"}
                onClick={alternarProva}
                className={provaAtiva ? "animate-pulse" : ""}
                title="Simulação de prova com 60 minutos"
              >
                {provaAtiva ? (
                  <>
                    <TimerOff className="mr-1.5 h-3.5 w-3.5" /> Encerrar prova {tempoProva}
                  </>
                ) : (
                  <>
                    <Timer className="mr-1.5 h-3.5 w-3.5" /> Modo prova 60 min
                  </>
                )}
              </Button>
              <Button
                size="xs"
                variant="secondary"
                className="lg:hidden ml-auto"
                onClick={() => setPainelAberto(true)}
              >
                Mentor/Busca/Revisão
              </Button>
            </div>
          </div>

          {/* Folha de redação */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Folha de redação — dissertativo-argumentativo
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                salvamento automático
              </p>
            </div>
            <textarea
              ref={textareaRef}
              value={textoFinal}
              onChange={(e) => setTextoFinal(e.target.value)}
              placeholder={`Escreva aqui sua redação.\n\nEstrutura sugerida:\n1. Introdução — contextualize e apresente a tese\n2. Desenvolvimento 1 — argumento 1 (tópico + repertório + análise)\n3. Desenvolvimento 2 — argumento 2 (tópico + repertório + análise)\n4. Conclusão — retome a tese e a proposta de intervenção completa`}
              aria-label="Editor da redação"
              spellCheck
              className="folha-redacao w-full resize-none bg-transparent px-6 py-3 font-serif text-foreground outline-none placeholder:text-muted-foreground/40"
              style={{ minHeight: "55vh", overflowY: "hidden" }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Dica: pressione{" "}
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px] font-mono">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px] font-mono">
              S
            </kbd>{" "}
            para confirmar o salvamento a qualquer momento.
          </p>
        </div>

        {/* ===== Coluna direita: ferramentas (desktop) ===== */}
        <aside className="hidden lg:flex lg:sticky lg:top-28 h-[calc(100vh-8rem)] min-h-96 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <SidePanel />
        </aside>
      </div>

      {/* ===== Painel mobile (drawer-like) ===== */}
      {painelAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPainelAberto(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-xl border-t border-border bg-card animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-border p-3">
              <p className="text-sm font-semibold">Ferramentas</p>
              <Button size="sm" variant="ghost" onClick={() => setPainelAberto(false)}>
                Fechar
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidePanel />
            </div>
          </div>
        </div>
      )}

      {/* ===== Folha de correção oficial (aparece somente na impressão/PDF) =====
          Portal para o body: permite esconder todo o app com display:none na
          impressão, sem páginas em branco por elementos apenas invisíveis. */}
      {montado &&
        createPortal(
          <div className="imprimir-folha">
        <div className="imprimir-cabecalho">
          <p className="imprimir-titulo">Redação Nota Máxima — folha de redação</p>
          <p className="imprimir-tema">Tema: {tema?.titulo ?? "Não informado"}</p>
        </div>
        <div className="imprimir-texto">
          {textoFinal
            .split(/\n{1,}/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
        <div className="imprimir-grade">
          <p className="imprimir-rodape">
            {stats.palavras} palavras · {stats.paragrafos} parágrafos · ~{stats.linhas} linhas
          </p>
          <table>
            <thead>
              <tr>
                <th>Competência</th>
                {[0, 40, 80, 120, 160, 200].map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["C1", "Domínio da norma culta"],
                ["C2", "Compreensão da proposta / repertório"],
                ["C3", "Organização e argumentação"],
                ["C4", "Coesão e mecanismos linguísticos"],
                ["C5", "Proposta de intervenção"],
              ].map(([codigo, nome]) => (
                <tr key={codigo}>
                  <td>
                    <strong>{codigo}</strong> — {nome}
                  </td>
                  {[0, 40, 80, 120, 160, 200].map((n) => (
                    <td key={n} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="imprimir-rodape">
            Nota total: ______ / 1000 · Corretor(a): ____________________________ · Data: ___/___/______
          </p>
            <p className="imprimir-rodape">
              Use esta folha para uma correção humana. O Diagnóstico local do app é uma estimativa didática, não uma nota oficial.
            </p>
          </div>
        </div>,
          document.body
        )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
