/**
 * Acesso tipado ao acervo de redações (gerado por scripts/parse-recursos.mjs).
 *
 * Este módulo roda no cliente e no servidor: é a base da Biblioteca e do
 * "modo local", que mantém o app útil mesmo sem backend de IA (ex.: GitHub Pages).
 */
import dados from "@/data/recursos.json";

export type TipoCitacao =
  | "filosofico"
  | "sociologico"
  | "dados"
  | "historico"
  | "legal"
  | "cultural";

export type EtiquetaParagrafo = "Introdução" | "Desenvolvimento" | "Conclusão";

export interface ParagrafoModelo {
  texto: string;
  etiqueta: EtiquetaParagrafo;
}

export interface RedacaoModelo {
  id: string;
  titulo: string;
  paragrafos: ParagrafoModelo[];
}

export interface Citacao {
  id: string;
  texto: string;
  autor: string;
  fonte: string;
  tipo: TipoCitacao;
  temaId: string;
  area: string;
}

export interface TemaAcervo {
  id: string;
  titulo: string;
  enunciado: string;
  area: string;
  resumo: string;
  palavrasChave: string[];
  textosMotivadores: { fonte: string; resumo: string }[];
  redacoes: RedacaoModelo[];
  citacoes: string[];
}

interface Acervo {
  fonte: string;
  geradoPor: string;
  totalTemas: number;
  totalCitacoes: number;
  totalRedacoes: number;
  temas: TemaAcervo[];
  citacoes: Citacao[];
}

export const acervo = dados as Acervo;

export const TIPOS_CITACAO: { value: TipoCitacao; label: string }[] = [
  { value: "filosofico", label: "Filosófico" },
  { value: "sociologico", label: "Sociológico" },
  { value: "legal", label: "Legal / institucional" },
  { value: "historico", label: "Histórico" },
  { value: "dados", label: "Dados" },
  { value: "cultural", label: "Cultural" },
];

export const AREAS_ACERVO = Array.from(new Set(acervo.temas.map((t) => t.area))).sort();

/** Remove acentos, pontuação e caixa para buscas tolerantes. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function termos(texto: string): string[] {
  return normalizar(texto)
    .split(" ")
    .filter((p) => p.length >= 4 && !STOPWORDS.has(p));
}

const STOPWORDS = new Set([
  "para", "com", "como", "mais", "mas", "que", "uma", "uns", "umas", "dos", "das",
  "pelos", "pelas", "sobre", "entre", "quando", "ainda", "muito", "sendo", "essa",
  "esse", "isso", "entao", "porque", "porem", "assim", "sobre", "tema", "texto",
  "brasil", "papel", "desde", "onde", "qual", "quais", "seu", "sua", "seus", "suas",
  "nao", "sem", "sob", "ter", "tem", "foi", "sao", "ser", "esta", "este", "isso",
]);

/** Pontua similaridade entre uma consulta e um texto do acervo. */
export function similaridade(consulta: string, alvo: string): number {
  const termosConsulta = termos(consulta);
  const texto = normalizar(alvo);
  if (termosConsulta.length === 0) return 0;
  return termosConsulta.reduce((acc, t) => acc + (texto.includes(t) ? 1 : 0), 0);
}

/** Encontra o dossiê do acervo mais próximo de um tema livre. */
export function temaMaisProximo(texto: string): TemaAcervo | undefined {
  let melhor: TemaAcervo | undefined;
  let maior = 0;
  for (const t of acervo.temas) {
    const pontos =
      similaridade(texto, `${t.titulo} ${t.enunciado}`) * 3 +
      similaridade(texto, t.palavrasChave.join(" "));
    if (pontos > maior) {
      maior = pontos;
      melhor = t;
    }
  }
  return melhor;
}

export function citacoesDoTema(temaId: string): Citacao[] {
  return acervo.citacoes.filter((c) => c.temaId === temaId);
}

export function citacaoPorId(id: string): Citacao | undefined {
  return acervo.citacoes.find((c) => c.id === id);
}

export interface ResultadoBuscaAcervo {
  temas: TemaAcervo[];
  citacoes: Citacao[];
  redacoes: { tema: TemaAcervo; redacao: RedacaoModelo }[];
}

/** Busca unificada usada pela Biblioteca e pela ferramenta Busca em modo local. */
export function buscarAcervo(consulta: string): ResultadoBuscaAcervo {
  const q = consulta.trim();
  if (q.length < 2) {
    return {
      temas: acervo.temas,
      citacoes: acervo.citacoes,
      redacoes: acervo.temas.flatMap((tema) =>
        tema.redacoes.map((redacao) => ({ tema, redacao }))
      ),
    };
  }
  const nq = normalizar(q);
  const temas = acervo.temas
    .map((t) => ({
      tema: t,
      pontos:
        (normalizar(t.titulo).includes(nq) ? 8 : 0) +
        similaridade(q, `${t.titulo} ${t.enunciado} ${t.area} ${t.resumo}`) * 2 +
        (normalizar(t.area).includes(nq) ? 4 : 0),
    }))
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .map((r) => r.tema);

  const citacoes = acervo.citacoes.filter(
    (c) =>
      normalizar(c.texto).includes(nq) ||
      normalizar(c.autor).includes(nq) ||
      normalizar(c.fonte).includes(nq) ||
      similaridade(q, c.texto) >= 2
  );

  const temasIds = new Set(temas.map((t) => t.id));
  const redacoes = acervo.temas
    .flatMap((tema) => tema.redacoes.map((redacao) => ({ tema, redacao })))
    .filter(
      (r) =>
        temasIds.has(r.tema.id) ||
        r.redacao.paragrafos.some((p) => normalizar(p.texto).includes(nq))
    );

  return { temas, citacoes, redacoes };
}

/** Texto completo de uma redação modelo (para leitura/exportação). */
export function redacaoComoTexto(redacao: RedacaoModelo): string {
  return redacao.paragrafos.map((p) => p.texto).join("\n\n");
}
