"use client";

/**
 * Camada única de acesso às rotas de IA.
 *
 * Em um servidor Node (dev, Vercel, Render…) as chamadas vão para /api/*.
 * Em publicação estática (GitHub Pages) ou quando o provedor de IA falha,
 * o app usa automaticamente o motor local (src/lib/local-ai.ts).
 *
 * Assim o usuário nunca fica diante de um botão que "não faz nada".
 */
import { toast } from "sonner";
import {
  arquiteturaLocal,
  buscaLocal,
  chatLocal,
  gerarTemasLocal,
  intervencaoLocal,
  repertorioLocal,
  revisaoLocal,
} from "@/lib/local-ai";
import { acervo } from "@/lib/recursos";
import type {
  ArquiteturaSugestao,
  BuscaResultado,
  ChatMessage,
  IntervencaoSugestao,
  RepertorioSugestao,
  RevisaoResultado,
  Tema,
} from "@/lib/types";

export const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_MODE === "true";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type Origem = "ia" | "local";

/** Disparado quando o backend de IA falha e o motor local assume a sessão. */
export const EVENTO_MODO_LOCAL = "redacao:modo-local";

interface Resultado<T> {
  data: T;
  origem: Origem;
}

let avisoExibido = false;
let usarLocal = STATIC_MODE;

function ativarModoLocal() {
  const primeiraVez = !usarLocal;
  usarLocal = true;
  if (primeiraVez && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_MODO_LOCAL));
  }
}

/** Erro 4xx: é do usuário (validação), não deve acionar o fallback local. */
class ErroDeValidacao extends Error {}

function avisarModoLocal() {
  if (avisoExibido) return;
  avisoExibido = true;
  toast.info("Modo local ativo", {
    description:
      "Sem servidor de IA, as ferramentas usam o acervo do projeto. Para revisão por IA, configure GEMINI_API_KEY no deploy com Node.",
    duration: 6000,
  });
}

/** Tenta o backend; cai para o motor local em qualquer falha de infraestrutura. */
async function post<T>(rota: string, body: unknown, fallback: () => T): Promise<Resultado<T>> {
  if (usarLocal) return { data: fallback(), origem: "local" };

  if (!STATIC_MODE) {
    try {
      const res = await fetch(`${BASE_PATH}${rota}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as T | null;
        if (data) return { data, origem: "ia" };
        throw new Error("Resposta vazia do servidor.");
      }
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status >= 400 && res.status < 500) {
        throw new ErroDeValidacao(payload?.error ?? `Requisição inválida (${res.status}).`);
      }
      throw new Error(payload?.error ?? `Servidor respondeu ${res.status}.`);
    } catch (err) {
      if (err instanceof ErroDeValidacao) throw err;
      // falha de rede, timeout, HTML do Pages, 5xx → modo local
      console.warn(`[api] ${rota} indisponível; usando motor local.`, err);
    }
  }
  ativarModoLocal();
  avisarModoLocal();
  return { data: fallback(), origem: "local" };
}

export async function detectarModo(): Promise<{
  modo: "ia" | "local";
  gemini: boolean;
  acervo: { temas: number; redacoes: number; citacoes: number };
}> {
  const dadosAcervo = {
    temas: acervo.totalTemas,
    redacoes: acervo.totalRedacoes,
    citacoes: acervo.totalCitacoes,
  };
  if (usarLocal) return { modo: "local", gemini: false, acervo: dadosAcervo };
  try {
    const res = await fetch(`${BASE_PATH}/api/status`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        online?: boolean;
        iaDisponivel?: boolean;
        gemini?: boolean;
      };
      const disponivel = data.iaDisponivel ?? data.online ?? false;
      if (!disponivel) ativarModoLocal();
      return {
        modo: disponivel ? "ia" : "local",
        gemini: Boolean(data.gemini),
        acervo: dadosAcervo,
      };
    }
  } catch {
    /* sem servidor */
  }
  ativarModoLocal();
  return { modo: "local", gemini: false, acervo: dadosAcervo };
}

// ---- Wrappers tipados (mesma assinatura das rotas) -------------------------

export function apiTemas(area: string) {
  return post<{ temas: Tema[] }>("/api/temas", { area }, () => ({
    temas: gerarTemasLocal(area),
  }));
}

export function apiArquitetura(tema: string, teseAtual: string) {
  return post<ArquiteturaSugestao>(
    "/api/arquitetura",
    { tema, teseAtual },
    () => arquiteturaLocal(tema, teseAtual)
  );
}

export function apiRepertorio(tema: string, tipo: string) {
  return post<{ sugestoes: RepertorioSugestao[] }>(
    "/api/repertorio",
    { tema, tipo },
    () => ({ sugestoes: repertorioLocal(tema, tipo) })
  );
}

export function apiIntervencao(tema: string, problema: string) {
  return post<IntervencaoSugestao>(
    "/api/intervencao",
    { tema, problema },
    () => intervencaoLocal(tema, problema)
  );
}

export function apiChat(
  messages: ChatMessage[],
  contexto: {
    tema?: string;
    tese?: string;
    arquitetura?: string;
    trechoTexto?: string;
  }
) {
  return post<{ resposta: string }>(
    "/api/chat",
    { messages, contexto },
    () => ({ resposta: chatLocal(messages, contexto) })
  );
}

export function apiBusca(query: string) {
  return post<BuscaResultado>("/api/busca", { query }, () => buscaLocal(query));
}

export function apiRevisao(texto: string, modo: "rapida" | "gramatical" | "profunda", tema: string) {
  return post<RevisaoResultado>(
    "/api/revisao",
    { texto, modo, tema },
    () => revisaoLocal(texto, modo, tema)
  );
}
