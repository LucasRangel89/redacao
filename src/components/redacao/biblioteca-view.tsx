"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Copy,
  FileText,
  Heart,
  PenLine,
  Quote,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRedacaoStore } from "@/lib/store";
import {
  acervo,
  AREAS_ACERVO,
  buscarAcervo,
  citacoesDoTema,
  redacaoComoTexto,
  TIPOS_CITACAO,
  type Citacao,
  type RedacaoModelo,
  type TemaAcervo,
} from "@/lib/recursos";
import type { Tema } from "@/lib/types";
import { cn } from "@/lib/utils";

type Aba = "temas" | "redacoes" | "citacoes" | "favoritos";

const COR_ETIQUETA: Record<string, string> = {
  Introdução: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Desenvolvimento: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Conclusão: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const TODAS_REDACOES = acervo.temas.flatMap((tema) =>
  tema.redacoes.map((redacao) => ({ tema, redacao }))
);

function primeiraFrase(texto: string, limite = 220): string {
  const corte = texto.search(/(?<=[.!?])\s/);
  const frase = corte > 30 ? texto.slice(0, corte + 1) : texto.slice(0, limite);
  return frase.length > limite ? `${frase.slice(0, limite).trimEnd()}…` : frase;
}

export function BibliotecaView() {
  const {
    bibliotecaQuery,
    setBibliotecaQuery,
    setTema,
    setStage,
    setView,
    setTese,
    setTextoFinal,
    textoFinal,
    addArgumento,
    updateArgumento,
    argumentos,
    favoritos,
    toggleFavorito,
  } = useRedacaoStore();

  const [aba, setAba] = useState<Aba>("temas");
  const [area, setArea] = useState("Todas");
  const [tipo, setTipo] = useState("todos");
  const [temaAberto, setTemaAberto] = useState<string | null>(null);
  const [leitura, setLeitura] = useState<{ tema: TemaAcervo; redacao: RedacaoModelo } | null>(null);

  const query = bibliotecaQuery.trim();
  const resultados = useMemo(() => buscarAcervo(query), [query]);

  const temas = useMemo(
    () =>
      (query ? resultados.temas : acervo.temas).filter(
        (t) => area === "Todas" || t.area === area
      ),
    [query, resultados.temas, area]
  );
  const citacoes = useMemo(
    () =>
      (query ? resultados.citacoes : acervo.citacoes).filter(
        (c) => tipo === "todos" || c.tipo === tipo
      ),
    [query, resultados.citacoes, tipo]
  );
  const redacoes = useMemo(
    () =>
      (query ? resultados.redacoes : TODAS_REDACOES).filter(
        (r) => area === "Todas" || r.tema.area === area
      ),
    [query, resultados.redacoes, area]
  );

  const favoritosTemas = acervo.temas.filter((t) => favoritos.includes(`tema:${t.id}`));
  const favoritosCitacoes = acervo.citacoes.filter((c) => favoritos.includes(`cit:${c.id}`));
  const favoritosRedacoes = TODAS_REDACOES.filter((r) =>
    favoritos.includes(`red:${r.redacao.id}`)
  );

  function copiar(texto: string, mensagem = "Copiado para a área de transferência.") {
    navigator.clipboard.writeText(texto).then(
      () => toast.success(mensagem),
      () => toast.error("Não foi possível copiar.")
    );
  }

  function usarTema(t: TemaAcervo) {
    const tema: Tema = {
      titulo: t.enunciado,
      area: t.area,
      textosMotivadores: t.textosMotivadores,
    };
    setTema(tema);
    setStage("arquitetura");
    setView("estudio");
    toast.success("Tema definido no estúdio.", {
      description: "Etapa 2: arquitetura de argumentos.",
    });
  }

  function usarCitacao(c: Citacao) {
    const trecho = `Segundo ${c.autor}, “${c.texto}”.`;
    setTextoFinal(textoFinal.trim() ? `${textoFinal.trim()}\n\n${trecho}` : trecho);
    setView("estudio");
    setStage("escrita");
    toast.success("Citação adicionada ao rascunho.", {
      description: "Adapte ao seu argumento e acrescente uma frase de análise.",
    });
  }

  function usarComoRepertorio(c: Citacao) {
    let alvo = argumentos[0];
    if (!alvo) {
      addArgumento();
      alvo = useRedacaoStore.getState().argumentos[0];
    }
    if (!alvo) return;
    updateArgumento(alvo.id, {
      repertorio: `${c.texto} — ${c.autor}`,
    });
    setView("estudio");
    setStage("arquitetura");
    toast.success("Repertório inserido no argumento 1.");
  }

  function usarEstrutura(tema: TemaAcervo, redacao: RedacaoModelo) {
    const intro = redacao.paragrafos.find((p) => p.etiqueta === "Introdução");
    const desenvolvimentos = redacao.paragrafos.filter(
      (p) => p.etiqueta === "Desenvolvimento"
    );
    const citacoesTema = citacoesDoTema(tema.id);
    setTese(primeiraFrase(intro?.texto ?? tema.resumo, 260));
    const novosArgumentos = desenvolvimentos.slice(0, 2).map((p, i) => {
      const cit = citacoesTema[i];
      return {
        id: `modelo-${redacao.id}-${i}-${Date.now()}`,
        topicoFrasal: primeiraFrase(p.texto, 180),
        repertorio: cit ? `${cit.texto} — ${cit.autor}` : "",
        analise:
          "Explique com suas palavras como esse repertório comprova o tópico frasal.",
      };
    });
    useRedacaoStore.setState({ argumentos: novosArgumentos });
    setTema({
      titulo: tema.enunciado,
      area: tema.area,
      textosMotivadores: tema.textosMotivadores,
    });
    setView("estudio");
    setStage("arquitetura");
    setLeitura(null);
    toast.success("Estrutura importada para o seu plano.", {
      description: "Agora reescreva cada tópico frasal com as suas palavras.",
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
          <BookOpen className="mr-1 h-3 w-3" /> Acervo versionado no projeto
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Biblioteca de redação</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {acervo.totalTemas} dossiês temáticos, {acervo.totalRedacoes} redações modelo
          anotadas por função (introdução, desenvolvimento, conclusão) e{" "}
          {acervo.totalCitacoes} citações classificadas por tipo de repertório. Use qualquer
          item diretamente no seu rascunho.
        </p>
      </div>

      {/* Busca + abas */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={bibliotecaQuery}
              onChange={(e) => setBibliotecaQuery(e.target.value)}
              placeholder="Buscar por tema, autor, palavra-chave ou trecho…"
              className="pl-9 pr-9"
              aria-label="Buscar no acervo"
            />
            {bibliotecaQuery && (
              <button
                type="button"
                onClick={() => setBibliotecaQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="temas" className="text-xs">
                Temas ({temas.length})
              </TabsTrigger>
              <TabsTrigger value="redacoes" className="text-xs">
                Redações ({redacoes.length})
              </TabsTrigger>
              <TabsTrigger value="citacoes" className="text-xs">
                Citações ({citacoes.length})
              </TabsTrigger>
              <TabsTrigger value="favoritos" className="text-xs">
                Favoritos ({favoritos.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {aba !== "favoritos" && (
            <div className="flex flex-wrap gap-1.5">
              {["Todas", ...AREAS_ACERVO].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    area === a
                      ? "border-primary bg-primary/20 text-blue-200"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
          {(aba === "citacoes" || aba === "favoritos") && (
            <div className="flex flex-wrap gap-1.5">
              {[{ value: "todos", label: "Todos os tipos" }, ...TIPOS_CITACAO].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    tipo === t.value
                      ? "border-blue-400 bg-blue-500/15 text-blue-200"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TEMAS */}
      {aba === "temas" && (
        <div className="grid gap-3 md:grid-cols-2">
          {temas.map((t) => {
            const aberto = temaAberto === t.id;
            const favorito = favoritos.includes(`tema:${t.id}`);
            return (
              <Card key={t.id} className={cn("transition-colors", aberto && "border-primary/40")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.area}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleFavorito(`tema:${t.id}`)}
                      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      className="text-muted-foreground hover:text-amber-400"
                    >
                      <Star className={cn("h-4 w-4", favorito && "fill-amber-400 text-amber-400")} />
                    </button>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-snug">{t.titulo}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{t.resumo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                    <span className="rounded border border-border px-1.5 py-0.5">
                      {t.redacoes.length} redações
                    </span>
                    <span className="rounded border border-border px-1.5 py-0.5">
                      {t.citacoes.length} citações
                    </span>
                    <span className="rounded border border-border px-1.5 py-0.5">
                      {t.textosMotivadores.length} motivadores
                    </span>
                  </div>

                  {aberto && (
                    <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
                          Enunciado no formato ENEM
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t.enunciado}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Textos motivadores
                        </p>
                        {t.textosMotivadores.map((m, i) => (
                          <div key={i} className="rounded border border-border bg-card/60 p-2 text-[11px]">
                            <p className="font-semibold text-blue-300">{m.fonte}</p>
                            <p className="mt-0.5 text-muted-foreground">{m.resumo}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Redações modelo
                        </p>
                        {t.redacoes.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setLeitura({ tema: t, redacao: r })}
                            className="flex w-full items-center justify-between gap-2 rounded border border-border bg-card/60 p-2 text-left text-[11px] hover:border-primary/40"
                          >
                            <span className="line-clamp-1">{r.titulo} · {r.paragrafos.length} parágrafos</span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-blue-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setTemaAberto(aberto ? null : t.id)}>
                      <ChevronDown className={cn("mr-1 h-3.5 w-3.5 transition-transform", aberto && "rotate-180")} />
                      {aberto ? "Recolher" : "Ver dossiê"}
                    </Button>
                    <Button size="sm" onClick={() => usarTema(t)}>
                      <PenLine className="mr-1 h-3.5 w-3.5" /> Escrever sobre isto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {temas.length === 0 && <Vazio texto="Nenhum tema encontrado. Tente outro termo." />}
        </div>
      )}

      {/* REDAÇÕES MODELO */}
      {aba === "redacoes" && (
        <div className="grid gap-3 md:grid-cols-2">
          {redacoes.map(({ tema, redacao }) => {
            const favorito = favoritos.includes(`red:${redacao.id}`);
            const palavras = redacao.paragrafos.reduce(
              (acc, p) => acc + p.texto.split(/\s+/).length,
              0
            );
            return (
              <Card key={`${tema.id}-${redacao.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {tema.area}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => toggleFavorito(`red:${redacao.id}`)}
                      aria-label="Favoritar redação"
                      className="text-muted-foreground hover:text-amber-400"
                    >
                      <Star className={cn("h-4 w-4", favorito && "fill-amber-400 text-amber-400")} />
                    </button>
                  </div>
                  <CardTitle className="line-clamp-2 text-sm font-semibold leading-snug">
                    {tema.titulo}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {redacao.titulo} · {redacao.paragrafos.length} parágrafos · ~{palavras} palavras
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {redacao.paragrafos.map((p, i) => (
                      <span
                        key={i}
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px]",
                          COR_ETIQUETA[p.etiqueta]
                        )}
                      >
                        {i + 1} · {p.etiqueta}
                      </span>
                    ))}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {redacao.paragrafos[0]?.texto}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLeitura({ tema, redacao })}>
                      <FileText className="mr-1 h-3.5 w-3.5" /> Ler com anotações
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => usarEstrutura(tema, redacao)}>
                      <Sparkles className="mr-1 h-3.5 w-3.5" /> Usar estrutura no plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {redacoes.length === 0 && <Vazio texto="Nenhuma redação encontrada para esse filtro." />}
        </div>
      )}

      {/* CITAÇÕES */}
      {aba === "citacoes" && (
        <div className="grid gap-3 md:grid-cols-2">
          {citacoes.map((c) => (
            <CitacaoCard
              key={c.id}
              citacao={c}
              favorito={favoritos.includes(`cit:${c.id}`)}
              onFavorito={() => toggleFavorito(`cit:${c.id}`)}
              onCopiar={() => copiar(`“${c.texto}” — ${c.autor}`, "Citação copiada.")}
              onUsar={() => usarCitacao(c)}
              onRepertorio={() => usarComoRepertorio(c)}
            />
          ))}
          {citacoes.length === 0 && <Vazio texto="Nenhuma citação encontrada. Troque o filtro ou a busca." />}
        </div>
      )}

      {/* FAVORITOS */}
      {aba === "favoritos" && (
        <div className="space-y-5">
          {favoritos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Heart className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Sua estante está vazia</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Clique na estrela de temas, redações ou citações para guardá-los aqui e
                  voltar rapidamente durante a escrita.
                </p>
                <Button size="sm" variant="outline" onClick={() => setAba("temas")}>
                  Explorar temas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {favoritosTemas.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold">Temas ({favoritosTemas.length})</h2>
                  <div className="grid gap-2 md:grid-cols-2">
                    {favoritosTemas.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                        <BookOpen className="h-4 w-4 shrink-0 text-blue-400" />
                        <p className="line-clamp-1 flex-1 text-xs">{t.titulo}</p>
                        <Button size="xs" variant="outline" onClick={() => usarTema(t)}>
                          Usar
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {favoritosRedacoes.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold">Redações ({favoritosRedacoes.length})</h2>
                  <div className="grid gap-2 md:grid-cols-2">
                    {favoritosRedacoes.map(({ tema, redacao }) => (
                      <button
                        key={redacao.id}
                        type="button"
                        onClick={() => setLeitura({ tema, redacao })}
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-left hover:border-primary/40"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                        <p className="line-clamp-1 flex-1 text-xs">{tema.titulo} · {redacao.titulo}</p>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {favoritosCitacoes.filter((c) => tipo === "todos" || c.tipo === tipo).length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold">Citações</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {favoritosCitacoes
                      .filter((c) => tipo === "todos" || c.tipo === tipo)
                      .map((c) => (
                        <CitacaoCard
                          key={c.id}
                          citacao={c}
                          favorito
                          onFavorito={() => toggleFavorito(`cit:${c.id}`)}
                          onCopiar={() => copiar(`“${c.texto}” — ${c.autor}`)}
                          onUsar={() => usarCitacao(c)}
                          onRepertorio={() => usarComoRepertorio(c)}
                        />
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Fonte: <code className="rounded bg-secondary px-1">docs/acervo-redacoes.md</code> ·
        dados gerados por <code className="rounded bg-secondary px-1">scripts/parse-recursos.mjs</code>.
        Confira a atribuição de citações antes de usá-las em uma prova.
      </p>

      {/* Leitor de redação modelo */}
      <Dialog open={Boolean(leitura)} onOpenChange={(open) => !open && setLeitura(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto scroll-fino">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-base leading-snug">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <span>{leitura?.tema.titulo}</span>
            </DialogTitle>
            <DialogDescription>
              {leitura?.redacao.titulo} · parágrafos anotados pela função que exercem no texto.
              Leia como estudo de estrutura, não como modelo para copiar.
            </DialogDescription>
          </DialogHeader>
          {leitura && (
            <div className="space-y-4">
              <div className="space-y-3">
                {leitura.redacao.paragrafos.map((p, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", COR_ETIQUETA[p.etiqueta])}
                      >
                        Parágrafo {i + 1} · {p.etiqueta}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => copiar(p.texto, "Parágrafo copiado.")}
                        className="text-muted-foreground hover:text-blue-300"
                        aria-label="Copiar parágrafo"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">{p.texto}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copiar(redacaoComoTexto(leitura.redacao), "Redação copiada.")}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copiar texto completo
                </Button>
                <Button size="sm" onClick={() => usarEstrutura(leitura.tema, leitura.redacao)}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Usar estrutura no meu plano
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CitacaoCard({
  citacao,
  favorito,
  onFavorito,
  onCopiar,
  onUsar,
  onRepertorio,
}: {
  citacao: Citacao;
  favorito: boolean;
  onFavorito: () => void;
  onCopiar: () => void;
  onUsar: () => void;
  onRepertorio: () => void;
}) {
  const tipo = TIPOS_CITACAO.find((t) => t.value === citacao.tipo)?.label ?? citacao.tipo;
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-[10px]">
            {tipo}
          </Badge>
          <button
            type="button"
            onClick={onFavorito}
            aria-label="Favoritar citação"
            className="text-muted-foreground hover:text-amber-400"
          >
            <Star className={cn("h-4 w-4", favorito && "fill-amber-400 text-amber-400")} />
          </button>
        </div>
        <CardTitle className="text-sm font-medium leading-relaxed">
          <Quote className="mr-1 inline h-3.5 w-3.5 text-blue-400" />
          {citacao.texto}
        </CardTitle>
        <CardDescription className="text-xs">— {citacao.autor}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-2 pt-0">
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{citacao.fonte}</p>
        <div className="flex flex-wrap gap-1.5">
          <Button size="xs" variant="outline" onClick={onCopiar}>
            <Copy className="mr-1 h-3 w-3" /> Copiar
          </Button>
          <Button size="xs" variant="outline" onClick={onRepertorio}>
            <Sparkles className="mr-1 h-3 w-3" /> Usar no plano
          </Button>
          <Button size="xs" variant="ghost" onClick={onUsar}>
            Inserir no rascunho <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <Card className="border-dashed md:col-span-2">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {texto}
      </CardContent>
    </Card>
  );
}
