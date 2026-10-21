"use client";

import { useMemo } from "react";
import { ClipboardList, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidePanel } from "@/components/redacao/side-panel";
import { estatisticasTexto, useRedacaoStore } from "@/lib/store";
import { useState } from "react";

export function EscritaStage() {
  const { tema, tese, argumentos, intervencao, textoFinal, setTextoFinal } =
    useRedacaoStore();
  const [planoVisivel, setPlanoVisivel] = useState(true);

  const stats = useMemo(() => estatisticasTexto(textoFinal), [textoFinal]);
  const metaLinhas = 30;
  const progressoLinhas = Math.min(100, (stats.linhas / metaLinhas) * 100);

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
                <div className="flex items-center justify-between">
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
                    <span className="font-semibold text-emerald-400">
                      Intervenção:{" "}
                    </span>
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

          {/* Estatísticas */}
          <div className="rounded-xl border border-border bg-card p-3">
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
                  /{metaLinhas} linhas
                </span>
                <Progress
                  value={progressoLinhas}
                  className="h-1.5 flex-1"
                  aria-label="Progresso de linhas"
                />
              </span>
            </div>
          </div>

          {/* Folha de redação */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Folha de redação — dissertativo-argumentativo
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                texto em rascunho · salvamento automático
              </p>
            </div>
            <textarea
              value={textoFinal}
              onChange={(e) => setTextoFinal(e.target.value)}
              placeholder={`Escreva aqui sua redação.\n\nEstrutura sugerida:\n1. Introdução — contextualize e apresente a tese\n2. Desenvolvimento 1 — argumento 1 (tópico + repertório + análise)\n3. Desenvolvimento 2 — argumento 2 (tópico + repertório + análise)\n4. Conclusão — retome a tese e a proposta de intervenção completa`}
              aria-label="Editor da redação"
              spellCheck
              className="folha-redacao w-full resize-none bg-transparent px-6 py-3 font-serif text-foreground outline-none placeholder:text-muted-foreground/40 min-h-[55vh]"
            />
          </div>
        </div>

        {/* ===== Coluna direita: ferramentas ===== */}
        <aside className="lg:sticky lg:top-20 h-[70vh] min-h-96 flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <SidePanel />
        </aside>
      </div>
    </div>
  );
}
