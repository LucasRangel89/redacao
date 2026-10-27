"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  ClipboardCheck,
  ExternalLink,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Markdown } from "@/components/redacao/markdown";
import { useRedacaoStore } from "@/lib/store";
import { apiBusca, apiChat, apiRevisao } from "@/lib/api";
import type {
  BuscaResultado,
  ChatMessage,
  ModoRevisao,
  RevisaoResultado,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGESTOES_MENTOR = [
  "Como melhorar minha introdução?",
  "Meu repertório é produtivo?",
  "O que falta para a nota 1000?",
  "Revise a lógica do meu argumento 1",
];

const MODOS: { value: ModoRevisao; label: string; desc: string }[] = [
  { value: "rapida", label: "Rápida", desc: "Leitura de superfície em segundos" },
  { value: "gramatical", label: "Gramatical", desc: "Varredura da norma culta (C1)" },
  { value: "profunda", label: "Profunda", desc: "Correção completa pelas 5 competências" },
];

export function SidePanel() {
  const { tema, tese, argumentos, textoFinal, irParaBiblioteca, salvarNoHistorico } =
    useRedacaoStore();

  // ---- Mentor ----
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const chatFimRef = useRef<HTMLDivElement>(null);

  // ---- Busca ----
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<BuscaResultado | null>(null);

  // ---- Revisão ----
  const [modo, setModo] = useState<ModoRevisao>("profunda");
  const [revisando, setRevisando] = useState(false);
  const [revisao, setRevisao] = useState<RevisaoResultado | null>(null);

  useEffect(() => {
    chatFimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, pensando]);

  async function enviarMensagem(texto?: string) {
    const conteudo = (texto ?? entrada).trim();
    if (!conteudo || pensando) return;
    const novas: ChatMessage[] = [...mensagens, { role: "user", content: conteudo }];
    setMensagens(novas);
    setEntrada("");
    setPensando(true);
    try {
      const { data } = await apiChat(novas, {
        tema: tema?.titulo,
        tese,
        arquitetura: argumentos
          .map((a, i) => `A${i + 1}: ${a.topicoFrasal}`)
          .join(" | "),
        trechoTexto: textoFinal.slice(0, 1200),
      });
      setMensagens((m) => [
        ...m,
        { role: "assistant", content: data.resposta },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "O mentor falhou.");
    } finally {
      setPensando(false);
    }
  }

  async function buscar() {
    if (!query.trim() || buscando) return;
    setBuscando(true);
    setResultado(null);
    try {
      const { data } = await apiBusca(query);
      setResultado(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca.");
    } finally {
      setBuscando(false);
    }
  }

  async function revisar() {
    if (!textoFinal.trim()) {
      toast.error("Escreva ao menos um parágrafo na folha antes de revisar.");
      return;
    }
    setRevisando(true);
    setRevisao(null);
    try {
      const { data } = await apiRevisao(textoFinal, modo, tema?.titulo ?? "");
      setRevisao(data);
      // Registra o diagnóstico no histórico local para acompanhar a evolução.
      salvarNoHistorico(data.notaEstimada);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na revisão.");
    } finally {
      setRevisando(false);
    }
  }

  function copiarDado(dado: string) {
    navigator.clipboard.writeText(dado).then(() => toast.success("Copiado!"));
  }

  return (
    <Tabs defaultValue="mentor" className="flex h-full flex-col gap-0">
      <TabsList className="grid w-full grid-cols-3 rounded-b-none border-b border-border bg-secondary/40 h-11">
        <TabsTrigger value="mentor" className="text-xs gap-1.5 data-[state=active]:bg-background">
          <MessageCircle className="h-3.5 w-3.5" /> Mentor
        </TabsTrigger>
        <TabsTrigger value="busca" className="text-xs gap-1.5 data-[state=active]:bg-background">
          <Search className="h-3.5 w-3.5" /> Busca
        </TabsTrigger>
        <TabsTrigger value="revisao" className="text-xs gap-1.5 data-[state=active]:bg-background">
          <ClipboardCheck className="h-3.5 w-3.5" /> Revisão
        </TabsTrigger>
      </TabsList>

      {/* ===== MENTOR ===== */}
      <TabsContent value="mentor" className="flex min-h-0 flex-1 flex-col mt-0">
        <div className="flex-1 min-h-0 overflow-y-auto scroll-fino p-3 space-y-3">
          {mensagens.length === 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seu mentor socrático guia sem escrever por você — mantendo a{" "}
                <span className="font-semibold text-blue-300">autoria</span> do texto.
                Pergunte sobre estrutura, coesão, repertório ou estratégia.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES_MENTOR.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviarMensagem(s)}
                    className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mensagens.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl px-3 py-2.5 max-w-[92%]",
                m.role === "user"
                  ? "ml-auto bg-primary/90 text-primary-foreground"
                  : "mr-auto border border-border bg-secondary/40"
              )}
            >
              {m.role === "user" ? (
                <p className="text-sm leading-relaxed">{m.content}</p>
              ) : (
                <Markdown>{m.content}</Markdown>
              )}
            </div>
          ))}
          {pensando && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
              Mentor pensando…
            </div>
          )}
          <div ref={chatFimRef} />
        </div>
        <div className="border-t border-border p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensagem();
            }}
          >
            <Input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Pergunte ao mentor…"
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={pensando || !entrada.trim()} aria-label="Enviar">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </TabsContent>

      {/* ===== BUSCA ===== */}
      <TabsContent value="busca" className="flex min-h-0 flex-1 flex-col mt-0">
        <div className="border-b border-border p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              buscar();
            }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cheque fatos e dados sem sair do app…"
              className="text-sm"
            />
            <Button type="submit" size="icon" disabled={buscando || !query.trim()} aria-label="Buscar">
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scroll-fino p-3 space-y-3">
          {buscando && (
            <p className="text-xs text-muted-foreground">Pesquisando fontes…</p>
          )}
          {resultado && (
            <>
              {resultado.sintese && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Síntese fundamentada
                  </p>
                  <p className="text-sm leading-relaxed">{resultado.sintese}</p>
                </div>
              )}
              {resultado.dados.length > 0 && (
                <div className="space-y-1.5">
                  {resultado.dados.map((d, i) => (
                    <div
                      key={i}
                      className="group flex items-start justify-between gap-2 rounded-lg border border-border bg-secondary/40 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs leading-relaxed">{d.dado}</p>
                        {d.fonte && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Fonte: {d.fonte}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => copiarDado(d.dado)}
                        aria-label="Copiar dado"
                      >
                        <Sparkles className="h-3 w-3 text-blue-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fontes
                </p>
                {resultado.resultados.map((r, i) =>
                  r.url.startsWith("local://") ? (
                    <button
                      key={i}
                      type="button"
                      onClick={() => irParaBiblioteca(query)}
                      className="block w-full rounded-lg border border-border p-2.5 text-left hover:border-primary/40 transition-colors"
                    >
                      <p className="flex items-start gap-1 text-xs font-medium leading-snug">
                        <BookOpenText className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                        {r.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {r.snippet}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-blue-300">
                        Abrir na Biblioteca →
                      </p>
                    </button>
                  ) : (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-border p-2.5 hover:border-primary/40 transition-colors"
                    >
                      <p className="flex items-start gap-1 text-xs font-medium leading-snug">
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                        {r.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {r.snippet}
                      </p>
                    </a>
                  )
                )}
              </div>
            </>
          )}
          {!resultado && !buscando && (
            <p className="pt-2 text-xs text-muted-foreground leading-relaxed">
              Busca fundamentada integrada à barra lateral: checagem de fatos e dados
              estatísticos <span className="text-blue-300">sem perda de contexto</span> da
              escrita.
            </p>
          )}
        </div>
      </TabsContent>

      {/* ===== REVISÃO ===== */}
      <TabsContent value="revisao" className="flex min-h-0 flex-1 flex-col mt-0">
        <div className="border-b border-border p-3 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {MODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModo(m.value)}
                title={m.desc}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  modo === m.value
                    ? "border-primary bg-primary/20 text-blue-200"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {MODOS.find((m) => m.value === modo)?.desc}
          </p>
          <Button size="sm" className="w-full" onClick={revisar} disabled={revisando}>
            {revisando ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Analisando texto…
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                Analisar meu texto
              </>
            )}
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scroll-fino p-3 space-y-4">
          {revisao ? (
            <>
              <p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm leading-relaxed">
                {revisao.resumo}
              </p>

              {revisao.notaEstimada !== undefined && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Nota estimada
                  </p>
                  <p className="text-3xl font-bold text-blue-200">
                    {revisao.notaEstimada}
                    <span className="text-sm font-normal text-muted-foreground">/1000</span>
                  </p>
                </div>
              )}

              {revisao.competencias && (
                <div className="space-y-2.5">
                  {revisao.competencias.map((c) => (
                    <div key={c.codigo} className="rounded-lg border border-border p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold">
                          <span className="mr-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                            {c.codigo}
                          </span>
                          {c.nome}
                        </p>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {c.nota}/200
                        </Badge>
                      </div>
                      <Progress value={(c.nota / 200) * 100} className="h-1.5" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {c.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {revisao.correcoes && revisao.correcoes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Correções da norma culta
                  </p>
                  {revisao.correcoes.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border p-2.5 space-y-1">
                      <p className="text-xs text-destructive line-through decoration-destructive/60">
                        {c.original}
                      </p>
                      <p className="text-xs font-medium text-emerald-400">→ {c.correcao}</p>
                      <p className="text-[11px] text-muted-foreground">{c.explicacao}</p>
                    </div>
                  ))}
                </div>
              )}

              {revisao.pontosFortes.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Pontos fortes
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    {revisao.pontosFortes.map((p, i) => (
                      <li key={i} className="text-xs leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {revisao.pontosMelhoria.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    Prioridades de melhoria
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    {revisao.pontosMelhoria.map((p, i) => (
                      <li key={i} className="text-xs leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {revisao.proximosPassos && revisao.proximosPassos.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                    Próximos passos
                  </p>
                  <ol className="list-decimal space-y-1 pl-4">
                    {revisao.proximosPassos.map((p, i) => (
                      <li key={i} className="text-xs leading-relaxed">{p}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            !revisando && (
              <p className="pt-2 text-xs text-muted-foreground leading-relaxed">
                Revisão multimodal: escolha o motor conforme a necessidade —{" "}
                <span className="text-blue-300">rápida</span> durante a escrita,{" "}
                <span className="text-blue-300">gramatical</span> para polir a norma culta
                e <span className="text-blue-300">profunda</span> para o diagnóstico
                completo pelas 5 competências.
              </p>
            )
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
