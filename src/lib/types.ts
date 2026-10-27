/**
 * Redação Nota Máxima AI — Tipos compartilhados
 */

export type Stage = "setup" | "arquitetura" | "escrita";

export type Engine = "pro" | "flash" | "flash-lite";

export interface TextoMotivador {
  fonte: string;
  resumo: string;
}

export interface Tema {
  titulo: string;
  area: string;
  textosMotivadores: TextoMotivador[];
}

export interface Argumento {
  id: string;
  topicoFrasal: string;
  repertorio: string;
  analise: string;
}

export interface PropostaIntervencao {
  agente: string;
  acao: string;
  meio: string;
  finalidade: string;
  detalhamento: string;
}

/** Uma versão salva pelo estudante (histórico local). */
export interface RedacaoSalva {
  id: string;
  criadoEm: number;
  titulo: string;
  area: string;
  texto: string;
  tese: string;
  argumentos: Argumento[];
  intervencao: PropostaIntervencao;
  palavras: number;
  linhas: number;
  paragrafos: number;
  tempoSegundos: number;
  notaEstimada?: number;
}

export type ModoRevisao = "rapida" | "gramatical" | "profunda";

export interface CompetenciaScore {
  codigo: string; // C1..C5
  nome: string;
  nota: number; // 0–200
  feedback: string;
}

export interface CorrecaoGramatical {
  original: string;
  correcao: string;
  explicacao: string;
}

export interface RevisaoResultado {
  resumo: string;
  pontosFortes: string[];
  pontosMelhoria: string[];
  competencias?: CompetenciaScore[];
  correcoes?: CorrecaoGramatical[];
  notaEstimada?: number; // 0–1000
  proximosPassos?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RepertorioSugestao {
  titulo: string;
  fonte: string;
  ideiaCentral: string;
  comoUsar: string;
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface BuscaResultado {
  sintese: string;
  dados: { dado: string; fonte: string }[];
  resultados: SearchResult[];
}

export interface ArquiteturaSugestao {
  tese: string;
  argumentos: {
    topicoFrasal: string;
    repertorio: string;
    analise: string;
  }[];
  aviso?: string;
}

export interface IntervencaoSugestao {
  agente: string;
  acao: string;
  meio: string;
  finalidade: string;
  detalhamento: string;
  esqueletoParagrafo: string;
}

export const AREAS_TEMAS = [
  "Geral",
  "Educação",
  "Meio Ambiente",
  "Tecnologia e Sociedade",
  "Saúde",
  "Cidadania e Direitos",
  "Cultura e Lazer",
  "Economia e Trabalho",
] as const;

export const TIPOS_REPERTORIO = [
  { value: "filosofico", label: "Filosófico" },
  { value: "sociologico", label: "Sociológico" },
  { value: "dados", label: "Dados estatísticos" },
  { value: "historico", label: "Histórico" },
  { value: "legal", label: "Legislação" },
  { value: "cultural", label: "Cultural (livros, filmes, séries)" },
] as const;
