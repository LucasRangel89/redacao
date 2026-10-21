"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Argumento,
  PropostaIntervencao,
  Stage,
  Tema,
} from "@/lib/types";

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

export const INTERVENCAO_VAZIA: PropostaIntervencao = {
  agente: "",
  acao: "",
  meio: "",
  finalidade: "",
  detalhamento: "",
};

interface RedacaoState {
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

export const useRedacaoStore = create<RedacaoState>()(
  persist(
    (set) => ({
      stage: "setup",
      tema: null,
      tese: "",
      argumentos: [],
      intervencao: INTERVENCAO_VAZIA,
      textoFinal: "",
      startedAt: null,
      stageStartedAt: null,
      savedAt: null,

      setStage: (stage) =>
        set({ stage, stageStartedAt: Date.now() }),

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
          stage: "setup",
          tema: null,
          tese: "",
          argumentos: [],
          intervencao: INTERVENCAO_VAZIA,
          textoFinal: "",
          startedAt: null,
          stageStartedAt: null,
          savedAt: null,
        }),
    }),
    {
      name: "redacao-nota-maxima",
      version: 2,
      // Migração simples: se não há estado persistido, retorna default;
      // caso contrário confia no Zustand para fazer merge com os defaults.
      migrate: (persisted: unknown) => {
        if (!persisted || typeof persisted !== "object") {
          return {};
        }
        return persisted as Partial<RedacaoState>;
      },
      // Faz merge com defaults para evitar `undefined` em campos novos
      merge: (persisted, current) => ({ ...current, ...(persisted as object) }),
    }
  )
);

/**
 * Estatísticas do texto no padrão da folha do ENEM.
 *
 * O ENEM considera ≈70 caracteres por linha (com margens), mas o cálculo
 * é feito por parágrafo: cada parágrafo inicia nova linha, e cada \n\n
 * também separa.
 */
export function estatisticasTexto(texto: string) {
  const trim = texto.trim();
  const palavras = trim ? trim.split(/\s+/).filter(Boolean).length : 0;
  const caracteres = texto.length;

  // Cada parágrafo inicia em uma nova linha visual (com indentação implícita).
  // Aproximação: cada parágrafo ocupa ceil(caracteres/70) linhas, mínimo 1 por parágrafo não-vazio.
  const blocos = trim
    .split(/\n{1,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let linhas = 0;
  for (const b of blocos) {
    // conta caracteres visíveis (desconta espaços múltiplos grosseiramente)
    const visiveis = b.length;
    linhas += Math.max(1, Math.ceil(visiveis / 70));
  }

  const paragrafos = blocos.length;

  // Meta: 30 linhas (tamanho oficial folha ENEM dissertativa)
  // Parágrafo introdutório ≈ 4-5 linhas; cada desenvolvimento ≈ 6-8 linhas; conclusão ≈ 5-7 linhas.
  return { palavras, caracteres, linhas, paragrafos };
}
