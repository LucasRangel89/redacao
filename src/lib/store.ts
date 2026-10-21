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

      setStage: (stage) => set({ stage }),
      setTema: (tema) => set({ tema }),
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
          s.startedAt === null ? { startedAt: Date.now() } : s
        ),
      novaRedacao: () =>
        set({
          stage: "setup",
          tema: null,
          tese: "",
          argumentos: [],
          intervencao: INTERVENCAO_VAZIA,
          textoFinal: "",
          startedAt: null,
        }),
    }),
    { name: "redacao-nota-maxima", version: 1 }
  )
);

/** Estatísticas do texto no padrão da folha do ENEM (≈70 caracteres/linha). */
export function estatisticasTexto(texto: string) {
  const trim = texto.trim();
  const palavras = trim ? trim.split(/\s+/).filter(Boolean).length : 0;
  const caracteres = texto.length;
  const linhas = Math.ceil(caracteres / 70);
  const paragrafos = trim
    ? trim.split(/\n\s*\n|\n/).filter((b) => b.trim().length > 0).length
    : 0;
  return { palavras, caracteres, linhas, paragrafos };
}
