"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Argumento,
  PropostaIntervencao,
  RedacaoSalva,
  Stage,
  Tema,
} from "@/lib/types";
import type { DadosPessoais } from "@/lib/backup";

export type { RedacaoSalva } from "@/lib/types";

const noopSubscribe = () => () => {};

/**
 * Detecta hidratação sem setState em effect (padrão useSyncExternalStore).
 * Necessário porque o estado da redação é persistido em localStorage.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export type View = "inicio" | "estudio" | "biblioteca" | "guia" | "progresso";

export const INTERVENCAO_VAZIA: PropostaIntervencao = {
  agente: "",
  acao: "",
  meio: "",
  finalidade: "",
  detalhamento: "",
};

interface RedacaoState {
  // Navegação
  view: View;
  bibliotecaQuery: string;
  setView: (view: View) => void;
  irParaBiblioteca: (query?: string) => void;
  setBibliotecaQuery: (query: string) => void;

  // Fluxo de escrita
  stage: Stage;
  tema: Tema | null;
  tese: string;
  argumentos: Argumento[];
  intervencao: PropostaIntervencao;
  textoFinal: string;
  startedAt: number | null;
  stageStartedAt: number | null;
  savedAt: number | null;

  setStage: (stage: Stage) => void;
  setTema: (tema: Tema) => void;
  setTese: (tese: string) => void;
  addArgumento: () => void;
  updateArgumento: (id: string, campo: Partial<Omit<Argumento, "id">>) => void;
  removeArgumento: (id: string) => void;
  updateIntervencao: (campo: Partial<PropostaIntervencao>) => void;
  setTextoFinal: (texto: string) => void;
  iniciarSessao: () => void;
  novaRedacao: () => void;
  marcarSalvo: () => void;

  // Biblioteca / histórico / treino
  historico: RedacaoSalva[];
  salvarNoHistorico: (notaEstimada?: number) => string | null;
  carregarDoHistorico: (id: string) => void;
  removerDoHistorico: (id: string) => void;
  limparHistorico: () => void;
  checklist: string[];
  toggleChecklist: (id: string) => void;
  resetChecklist: () => void;
  provaAte: number | null;
  iniciarProva: (minutos?: number) => void;
  encerrarProva: () => void;
  favoritos: string[];
  toggleFavorito: (id: string) => void;

  // Portabilidade de dados (P0.1): backup em arquivo, sem login/servidor.
  aplicarBackup: (dados: DadosPessoais) => void;
  apagarTudo: () => void;
}

export function novoArgumento(): Argumento {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `arg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    topicoFrasal: "",
    repertorio: "",
    analise: "",
  };
}

function gerarId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function estatisticasTexto(texto: string) {
  const trim = texto.trim();
  const palavras = trim ? trim.split(/\s+/).filter(Boolean).length : 0;
  const caracteres = texto.length;

  const blocos = trim
    .split(/\n{1,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let linhas = 0;
  for (const b of blocos) {
    linhas += Math.max(1, Math.ceil(b.length / 70));
  }

  return { palavras, caracteres, linhas, paragrafos: blocos.length };
}

export const useRedacaoStore = create<RedacaoState>()(
  persist(
    (set, get) => ({
      view: "inicio",
      bibliotecaQuery: "",
      setView: (view) => set({ view }),
      irParaBiblioteca: (query) =>
        set({ view: "biblioteca", bibliotecaQuery: query ?? "" }),
      setBibliotecaQuery: (bibliotecaQuery) => set({ bibliotecaQuery }),

      stage: "setup",
      tema: null,
      tese: "",
      argumentos: [],
      intervencao: INTERVENCAO_VAZIA,
      textoFinal: "",
      startedAt: null,
      stageStartedAt: null,
      savedAt: null,

      setStage: (stage) => set({ stage, stageStartedAt: Date.now() }),
      setTema: (tema) =>
        set({ tema, startedAt: Date.now(), stageStartedAt: Date.now() }),
      setTese: (tese) => set({ tese }),
      addArgumento: () =>
        set((s) => {
          if (s.argumentos.length >= 3) return s;
          return { argumentos: [...s.argumentos, novoArgumento()] };
        }),
      updateArgumento: (id, campo) =>
        set((s) => ({
          argumentos: s.argumentos.map((a) =>
            a.id === id ? { ...a, ...campo } : a
          ),
        })),
      removeArgumento: (id) =>
        set((s) => ({
          argumentos: s.argumentos.filter((a) => a.id !== id),
        })),
      updateIntervencao: (campo) =>
        set((s) => ({ intervencao: { ...s.intervencao, ...campo } })),
      setTextoFinal: (textoFinal) => set({ textoFinal }),
      iniciarSessao: () =>
        set((s) =>
          s.startedAt === null
            ? { startedAt: Date.now(), stageStartedAt: Date.now() }
            : s
        ),
      marcarSalvo: () => set({ savedAt: Date.now() }),
      novaRedacao: () =>
        set({
          view: "estudio",
          stage: "setup",
          tema: null,
          tese: "",
          argumentos: [],
          intervencao: INTERVENCAO_VAZIA,
          textoFinal: "",
          startedAt: null,
          stageStartedAt: null,
          savedAt: null,
          provaAte: null,
        }),

      historico: [],
      salvarNoHistorico: (notaEstimada) => {
        const s = get();
        if (s.textoFinal.trim().length < 20) return null;
        const stats = estatisticasTexto(s.textoFinal);
        const tempoSegundos = s.startedAt
          ? Math.round((Date.now() - s.startedAt) / 1000)
          : 0;
        const existente = s.historico.find(
          (h) => h.titulo === s.tema?.titulo && h.texto === s.textoFinal
        );
        if (existente) {
          set({
            historico: s.historico.map((h) =>
              h.id === existente.id
                ? { ...h, notaEstimada: notaEstimada ?? h.notaEstimada, tempoSegundos }
                : h
            ),
          });
          return existente.id;
        }
        const item: RedacaoSalva = {
          id: gerarId(),
          criadoEm: Date.now(),
          titulo: s.tema?.titulo ?? "Redação sem tema definido",
          area: s.tema?.area ?? "Tema próprio",
          texto: s.textoFinal,
          tese: s.tese,
          argumentos: s.argumentos,
          intervencao: s.intervencao,
          palavras: stats.palavras,
          linhas: stats.linhas,
          paragrafos: stats.paragrafos,
          tempoSegundos,
          ...(notaEstimada !== undefined ? { notaEstimada } : {}),
        };
        set({ historico: [item, ...s.historico].slice(0, 30) });
        return item.id;
      },
      carregarDoHistorico: (id) => {
        const item = get().historico.find((h) => h.id === id);
        if (!item) return;
        set({
          view: "estudio",
          stage: "escrita",
          tema: { titulo: item.titulo, area: item.area, textosMotivadores: [] },
          tese: item.tese,
          argumentos: item.argumentos,
          intervencao: item.intervencao,
          textoFinal: item.texto,
          startedAt: Date.now(),
          stageStartedAt: Date.now(),
          provaAte: null,
        });
      },
      removerDoHistorico: (id) =>
        set((s) => ({ historico: s.historico.filter((h) => h.id !== id) })),
      limparHistorico: () => set({ historico: [] }),

      checklist: [],
      toggleChecklist: (id) =>
        set((s) => ({
          checklist: s.checklist.includes(id)
            ? s.checklist.filter((c) => c !== id)
            : [...s.checklist, id],
        })),
      resetChecklist: () => set({ checklist: [] }),

      provaAte: null,
      iniciarProva: (minutos = 60) =>
        set({
          provaAte: Date.now() + minutos * 60_000,
          startedAt: get().startedAt ?? Date.now(),
        }),
      encerrarProva: () => set({ provaAte: null }),

      favoritos: [],
      toggleFavorito: (id) =>
        set((s) => ({
          favoritos: s.favoritos.includes(id)
            ? s.favoritos.filter((f) => f !== id)
            : [...s.favoritos, id],
        })),

      aplicarBackup: (dados) =>
        set({
          historico: dados.historico,
          favoritos: dados.favoritos,
          checklist: dados.checklist,
          tema: dados.rascunho.tema,
          tese: dados.rascunho.tese,
          argumentos: dados.rascunho.argumentos,
          intervencao: dados.rascunho.intervencao,
          textoFinal: dados.rascunho.textoFinal,
          stage: dados.rascunho.stage,
          stageStartedAt: Date.now(),
          savedAt: Date.now(),
          provaAte: null,
        }),
      apagarTudo: () => {
        // Volta ao estado inicial e remove qualquer resquício do localStorage.
        set(useRedacaoStore.getInitialState());
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem("redacao-nota-maxima");
          } catch {
            /* navegador em modo privado bloqueia storage */
          }
        }
      },
    }),
    {
      name: "redacao-nota-maxima",
      version: 3,
      migrate: (persisted: unknown) => {
        if (!persisted || typeof persisted !== "object") return {};
        return persisted as Partial<RedacaoState>;
      },
      // Faz merge com defaults para evitar `undefined` em campos novos
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    }
  )
);
