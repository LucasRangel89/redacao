/**
 * Banco de repertórios verificados (item P0.2 do plano de evolução).
 *
 * Diferente das citações extraídas de `docs/acervo-redacoes.md`, estes itens
 * foram curados com autor, fonte e URL explícitos. Paráfrases são marcadas como
 * tal para que o estudante nunca apresente uma reformulação como citação literal.
 *
 * O JSON é a fonte de verdade e é validado por `scripts/validar-repertorios.mjs`.
 * Este módulo é puro (roda no cliente e no servidor): essencial para o modo local.
 */
import dados from "./repertorios-verificados.json";
import {
  AREAS_ACERVO,
  normalizar,
  similaridade,
  TIPOS_CITACAO,
  type Citacao,
  type TipoCitacao,
} from "@/lib/recursos";
import type { RepertorioSugestao } from "@/lib/types";

export type NaturezaRepertorio = "norma" | "dado" | "citacao" | "paráfrase";
export type NivelFonte = "primaria" | "secundaria";

export interface RepertorioVerificado {
  id: string;
  tipo: TipoCitacao;
  natureza: NaturezaRepertorio;
  nivelFonte: NivelFonte;
  texto: string;
  autor: string;
  fonte: string;
  url: string;
  ano: number;
  verificadoEm: string;
  area: string;
  comoUsar: string;
  observacao?: string;
}

export const repertoriosVerificados = dados as RepertorioVerificado[];

export const TOTAL_REPERTORIOS_VERIFICADOS = repertoriosVerificados.length;

export const TIPOS_REPERTORIO = TIPOS_CITACAO;
export const AREAS_REPERTORIO = Array.from(
  new Set([...AREAS_ACERVO, ...repertoriosVerificados.map((r) => r.area)])
).sort();

export const ROTULOS_NATUREZA: Record<NaturezaRepertorio, string> = {
  norma: "Norma legal",
  dado: "Dado oficial",
  citacao: "Citação literal",
  "paráfrase": "Paráfrase",
};

/** Adapta um item verificado ao formato já usado pelos cards da Biblioteca. */
export function verificadoComoCitacao(r: RepertorioVerificado): Citacao {
  return {
    id: `verif:${r.id}`,
    texto: r.texto,
    autor: r.autor,
    fonte: `${r.fonte} · ${r.url}`,
    tipo: r.tipo,
    temaId: "",
    area: r.area,
  };
}

export function repertorioPorIdVerificado(id: string): RepertorioVerificado | undefined {
  const limpo = id.startsWith("verif:") ? id.slice(6) : id;
  return repertoriosVerificados.find((r) => r.id === limpo);
}

/** Busca tolerante a acentos, com filtros opcionais de tipo e área. */
export function buscarRepertoriosVerificados(
  consulta: string,
  tipo: string = "todos",
  area: string = "Todas"
): RepertorioVerificado[] {
  const q = consulta.trim();
  const base = repertoriosVerificados.filter(
    (r) =>
      (tipo === "todos" || r.tipo === tipo) &&
      (area === "Todas" || r.area === area)
  );
  if (q.length < 2) return base;

  const nq = normalizar(q);
  return base
    .map((r) => ({
      r,
      pontos:
        (normalizar(`${r.texto} ${r.autor} ${r.fonte} ${r.area} ${r.comoUsar}`).includes(nq)
          ? 8
          : 0) +
        similaridade(q, `${r.texto} ${r.autor} ${r.fonte} ${r.comoUsar}`) * 2 +
        (normalizar(r.tipo).includes(nq) ? 2 : 0),
    }))
    .filter((x) => x.pontos > 0)
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        (a.r.nivelFonte === "primaria" ? -1 : 1) -
          (b.r.nivelFonte === "primaria" ? -1 : 1)
    )
    .map((x) => x.r);
}

/** Converte para o formato esperado pela ferramenta de repertório. */
export function repertorioVerificadoComoSugestao(
  r: RepertorioVerificado
): RepertorioSugestao {
  const natureza = ROTULOS_NATUREZA[r.natureza];
  return {
    titulo: `“${r.texto.slice(0, 95)}${r.texto.length > 95 ? "…" : ""}”`,
    fonte: `${r.autor} · ${natureza} · fonte ${r.nivelFonte === "primaria" ? "oficial" : "de referência"}`,
    ideiaCentral: r.texto,
    comoUsar: `${r.comoUsar} Fonte: ${r.fonte} (${r.url}).`,
  };
}
