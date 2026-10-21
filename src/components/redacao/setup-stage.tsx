"use client";

import { useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  Landmark,
  Loader2,
  Sparkles,
  Target,
  WandSparkles,
  ArrowRight,
  CheckCircle2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRedacaoStore } from "@/lib/store";
import { AREAS_TEMAS, type Tema } from "@/lib/types";

const useStore = useRedacaoStore;

export function SetupStage() {
  const setTema = useStore((s) => s.setTema);
  const setStage = useStore((s) => s.setStage);
  const iniciarSessao = useRedacaoStore((s) => s.iniciarSessao);
  const temaAtual = useStore((s) => s.tema);

  const [area, setArea] = useState<string>("Geral");
  const [gerando, setGerando] = useState(false);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);

  const [tituloManual, setTituloManual] = useState("");

  async function gerarTemas() {
    setGerando(true);
    try {
      const res = await fetch("/api/temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao gerar temas");
      setTemas(data.temas as Tema[]);
      setExpandido(null);
      toast.success(`${data.temas.length} temas gerados com base em debates reais.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar temas.");
    } finally {
      setGerando(false);
    }
  }

  function escolherTema(t: Tema) {
    iniciarSessao();
    setTema(t);
    toast.success("Tema definido! Vamos arquitetar seu texto.", {
      description: "Etapa 2: tese, argumentos e proposta de intervenção.",
    });
    setTimeout(() => setStage("arquitetura"), 400);
  }

  function definirManual() {
    if (tituloManual.trim().length < 10) {
      toast.error("Descreva o tema com pelo menos uma frase completa.");
      return;
    }
    iniciarSessao();
    setTema({
      titulo: tituloManual.trim(),
      area: "Tema próprio",
      textosMotivadores: [],
    });
    toast.success("Tema definido!");
    setTimeout(() => setStage("arquitetura"), 400);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Hero */}
      <section className="text-center space-y-3 pt-4">
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-300">
          <Sparkles className="mr-1 h-3 w-3" /> Assistente de escrita com IA Generativa
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Vencendo a{" "}
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            página em branco
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground">
          Escolha um tema atualizado gerado a partir de debates reais da sociedade
          brasileira — ou insira o seu próprio — e siga um framework guiado de
          planejamento antes de escrever a redação final.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
            <Target className="h-3.5 w-3.5 text-blue-400" /> 5 competências do ENEM
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
            <Landmark className="h-3.5 w-3.5 text-blue-400" /> Repertório produtivo
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
            <BookOpenText className="h-3.5 w-3.5 text-blue-400" /> Scaffold antes do texto
          </span>
        </div>
      </section>

      {/* Tema em andamento */}
      {temaAtual && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-400" />
            <p className="text-sm flex-1 min-w-0">
              <span className="font-semibold">Tema escolhido: </span>
              <span className="text-muted-foreground line-clamp-2">
                {temaAtual.titulo}
              </span>
            </p>
            <Button size="sm" onClick={() => setStage("arquitetura")}>
              Continuar planejamento <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Gerador de temas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-blue-400" />
            Gerador de temas atualizados
          </CardTitle>
          <CardDescription>
            Busca fundamentada (grounded search): a IA pesquisa debates reais e
            recentes da sociedade brasileira para propor temas no formato ENEM, com
            textos motivadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="sm:w-56" aria-label="Área temática">
              <SelectValue placeholder="Área temática" />
            </SelectTrigger>
            <SelectContent>
              {AREAS_TEMAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={gerarTemas} disabled={gerando} className="sm:flex-1">
            {gerando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pesquisando debates atuais…
              </>
            ) : (
              <>
                <WandSparkles className="mr-2 h-4 w-4" />
                Gerar temas com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de temas gerados */}
      {temas.length > 0 && (
        <section className="space-y-3" aria-label="Temas gerados">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Temas sugeridos — clique para ver os textos motivadores
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {temas.map((t, i) => (
              <Card key={i} className="flex flex-col transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {t.area}
                    </Badge>
                    <button
                      type="button"
                      aria-label="Expandir textos motivadores"
                      onClick={() => setExpandido(expandido === i ? null : i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expandido === i ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                  <CardTitle className="text-sm font-medium leading-relaxed line-clamp-3">
                    {t.titulo}
                  </CardTitle>
                </CardHeader>
                {expandido === i && t.textosMotivadores.length > 0 && (
                  <CardContent className="pt-0 pb-2 space-y-2">
                    {t.textosMotivadores.map((m, j) => (
                      <div
                        key={j}
                        className="rounded-md border border-border bg-secondary/40 p-2.5 text-xs"
                      >
                        <p className="font-semibold text-blue-300">{m.fonte}</p>
                        <p className="text-muted-foreground mt-0.5">{m.resumo}</p>
                      </div>
                    ))}
                  </CardContent>
                )}
                <CardContent className="mt-auto pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => escolherTema(t)}
                  >
                    Escrever sobre este tema
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Divisor */}
      <div className="flex items-center gap-3" role="separator">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Tema manual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Definir tema manualmente</CardTitle>
          <CardDescription>
            Já tem o tema da prova ou da escola? Cole o enunciado e siga o mesmo
            framework guiado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input
            value={tituloManual}
            onChange={(e) => setTituloManual(e.target.value)}
            placeholder='Ex.: "Os desafios da educação financeira no Brasil: apresente proposta de intervenção…"'
            className="sm:flex-1"
            onKeyDown={(e) => e.key === "Enter" && definirManual()}
          />
          <Button variant="secondary" onClick={definirManual}>
            Definir tema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
