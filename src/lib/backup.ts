/**
 * Portabilidade de dados — item P0.1 (redefinido para uso pessoal).
 *
 * Decisão de produto: o app é usado por UMA pessoa em notebook, celular e
 * tablet. Em vez de contas + banco na nuvem, o próprio usuário leva seus dados
 * em um arquivo JSON ("maleta"). Isso funciona:
 *   - sem login, sem servidor e sem custo;
 *   - no site estático do GitHub Pages;
 *   - com privacidade total: nada sai do aparelho sem o usuário baixar o arquivo.
 *
 * Este módulo é PURO (sem React, sem localStorage, sem fetch): fácil de testar
 * com `node --test` e seguro para rodar no cliente.
 */
import { CHECKLIST } from "@/data/guia";
import type {
  Argumento,
  PropostaIntervencao,
  RedacaoSalva,
  Stage,
  Tema,
} from "@/lib/types";

export const FORMATO_BACKUP = "redacao-nota-maxima-backup";
export const VERSAO_BACKUP = 1;
/** Limites protegem contra arquivos malformados ou gigantes. */
export const LIMITE_VERSOES = 200;
export const LIMITE_HISTORICO_APP = 30;
export const LIMITE_TEXTO = 20_000;
export const LIMITE_FAVORITOS = 500;

const STAGES: Stage[] = ["setup", "arquitetura", "escrita"];
const IDS_CHECKLIST = new Set(CHECKLIST.map((c) => c.id));

export const INTERVENCAO_VAZIA: PropostaIntervencao = {
  agente: "",
  acao: "",
  meio: "",
  finalidade: "",
  detalhamento: "",
};

export interface RascunhoPessoal {
  tema: Tema | null;
  tese: string;
  argumentos: Argumento[];
  intervencao: PropostaIntervencao;
  textoFinal: string;
  stage: Stage;
}

/** Tudo o que pertence ao usuário e precisa viajar entre aparelhos. */
export interface DadosPessoais {
  historico: RedacaoSalva[];
  favoritos: string[];
  checklist: string[];
  rascunho: RascunhoPessoal;
}

/** Formato de saída do arquivo JSON. */
export interface ArquivoBackup {
  formato: typeof FORMATO_BACKUP;
  versao: number;
  exportadoEm: number;
  aplicativo: string;
  dados: DadosPessoais;
}

/** Subconjunto do estado da aplicação necessário para gerar o backup. */
export interface EstadoParaBackup {
  historico: RedacaoSalva[];
  favoritos: string[];
  checklist: string[];
  tema: Tema | null;
  tese: string;
  argumentos: Argumento[];
  intervencao: PropostaIntervencao;
  textoFinal: string;
  stage: Stage;
}

export type ModoRestauracao = "mesclar" | "substituir";

export interface ResumoBackup {
  data: string;
  versoes: number;
  favoritos: number;
  checklist: number;
  temRascunho: boolean;
}

// ---------------------------------------------------------------------------
// Helpers de saneamento
// ---------------------------------------------------------------------------

function texto(valor: unknown, max = LIMITE_TEXTO): string {
  return typeof valor === "string" ? valor.slice(0, max) : "";
}

function numero(valor: unknown, padrao = 0): number {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0
    ? Math.round(valor)
    : padrao;
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function contarTexto(t: string): { palavras: number; paragrafos: number; linhas: number } {
  const blocos = t.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const palavras = t.trim() ? t.trim().split(/\s+/).length : 0;
  const linhas = blocos.reduce((acc, b) => acc + Math.max(1, Math.ceil(b.length / 70)), 0);
  return { palavras, paragrafos: blocos.length, linhas };
}

function limparIntervencao(valor: unknown): PropostaIntervencao {
  const o = objeto(valor);
  return {
    agente: texto(o.agente, 1000),
    acao: texto(o.acao, 1000),
    meio: texto(o.meio, 1000),
    finalidade: texto(o.finalidade, 1000),
    detalhamento: texto(o.detalhamento, 1000),
  };
}

function limparArgumentos(valor: unknown): Argumento[] {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, 3).map((a, i) => {
    const o = objeto(a);
    return {
      id: texto(o.id, 100) || `restaurado-${i}`,
      topicoFrasal: texto(o.topicoFrasal, 2000),
      repertorio: texto(o.repertorio, 2000),
      analise: texto(o.analise, 2000),
    };
  });
}

function limparTema(valor: unknown): Tema | null {
  if (valor === null || valor === undefined) return null;
  const o = objeto(valor);
  const titulo = texto(o.titulo, 2000).trim();
  if (!titulo) return null;
  const motivadores = Array.isArray(o.textosMotivadores)
    ? o.textosMotivadores.slice(0, 10).map((m) => {
        const x = objeto(m);
        return { fonte: texto(x.fonte, 500), resumo: texto(x.resumo, 1000) };
      })
    : [];
  return {
    titulo,
    area: texto(o.area, 200) || "Tema próprio",
    textosMotivadores: motivadores,
  };
}

function limparRedacao(valor: unknown, i: number): RedacaoSalva | null {
  const o = objeto(valor);
  const conteudo = texto(o.texto);
  if (!conteudo.trim()) return null;
  const stats = contarTexto(conteudo);
  const nota = o.notaEstimada;
  return {
    id: texto(o.id, 100) || `restaurado-${i}-${stats.palavras}`,
    criadoEm: numero(o.criadoEm, Date.now()),
    titulo: texto(o.titulo, 1000) || "Redação sem tema definido",
    area: texto(o.area, 200) || "Tema próprio",
    texto: conteudo,
    tese: texto(o.tese, 3000),
    argumentos: limparArgumentos(o.argumentos),
    intervencao: limparIntervencao(o.intervencao),
    palavras: stats.palavras,
    linhas: stats.linhas,
    paragrafos: stats.paragrafos,
    tempoSegundos: numero(o.tempoSegundos),
    ...(typeof nota === "number" && Number.isFinite(nota) && nota >= 0 && nota <= 1000
      ? { notaEstimada: Math.round(nota) }
      : {}),
  };
}

function limparListaTexto(valor: unknown, max: number, tamanhoItem = 120): string[] {
  if (!Array.isArray(valor)) return [];
  return Array.from(
    new Set(
      valor
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.slice(0, tamanhoItem))
        .filter(Boolean)
    )
  ).slice(0, max);
}

function limparChecklist(valor: unknown): string[] {
  return limparListaTexto(valor, CHECKLIST.length, 20).filter((id) => IDS_CHECKLIST.has(id));
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

export function gerarBackup(estado: EstadoParaBackup, agora = Date.now()): ArquivoBackup {
  return {
    formato: FORMATO_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm: agora,
    aplicativo: "Redação Nota Máxima AI",
    dados: {
      historico: estado.historico.slice(0, LIMITE_VERSOES).map((h) => ({
        ...h,
        texto: h.texto.slice(0, LIMITE_TEXTO),
        tese: h.tese.slice(0, 3000),
        argumentos: h.argumentos.map((a) => ({
          ...a,
          topicoFrasal: a.topicoFrasal.slice(0, 2000),
          repertorio: a.repertorio.slice(0, 2000),
          analise: a.analise.slice(0, 2000),
        })),
      })),
      favoritos: limparListaTexto(estado.favoritos, LIMITE_FAVORITOS),
      checklist: limparChecklist(estado.checklist),
      rascunho: {
        tema: limparTema(estado.tema),
        tese: texto(estado.tese, 3000),
        argumentos: limparArgumentos(estado.argumentos),
        intervencao: limparIntervencao(estado.intervencao),
        textoFinal: texto(estado.textoFinal),
        stage: STAGES.includes(estado.stage) ? estado.stage : "setup",
      },
    },
  };
}

export function serializarBackup(arquivo: ArquivoBackup): string {
  return JSON.stringify(arquivo, null, 2);
}

export function nomeArquivoBackup(quando = Date.now()): string {
  const d = new Date(quando);
  const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `redacao-backup-${data}.json`;
}

export function resumoBackup(arquivo: ArquivoBackup): ResumoBackup {
  return {
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(arquivo.exportadoEm)
    ),
    versoes: arquivo.dados.historico.length,
    favoritos: arquivo.dados.favoritos.length,
    checklist: arquivo.dados.checklist.length,
    temRascunho: arquivo.dados.rascunho.textoFinal.trim().length > 0,
  };
}

// ---------------------------------------------------------------------------
// Leitura / validação
// ---------------------------------------------------------------------------

export type ResultadoValidacao =
  | { ok: true; arquivo: ArquivoBackup }
  | { ok: false; erro: string };

/**
 * Nunca lança exceção: arquivo inválido vira mensagem amigável em português.
 * Todos os campos são saneados e limitados antes de chegar ao estado do app.
 */
export function validarBackup(bruto: unknown): ResultadoValidacao {
  const o = objeto(bruto);
  if (o.formato !== FORMATO_BACKUP) {
    return {
      ok: false,
      erro: "Este arquivo não é um backup do Redação Nota Máxima. Escolha um arquivo terminado em .json gerado pelo botão 'Baixar meus dados'.",
    };
  }
  if (typeof o.versao !== "number" || o.versao > VERSAO_BACKUP || o.versao < 1) {
    return {
      ok: false,
      erro: `Versão de backup ${String(o.versao)} não suportada. Este app abre arquivos da versão ${VERSAO_BACKUP}.`,
    };
  }
  const dados = objeto(o.dados);
  if (Array.isArray(dados) || Object.keys(dados).length === 0) {
    return { ok: false, erro: "O arquivo está vazio ou sem a seção de dados." };
  }

  const historicoBruto = Array.isArray(dados.historico) ? dados.historico : [];
  if (historicoBruto.length > LIMITE_VERSOES) {
    return { ok: false, erro: `Arquivo grande demais (máx. ${LIMITE_VERSOES} versões).` };
  }
  const historico = historicoBruto
    .map(limparRedacao)
    .filter((h): h is RedacaoSalva => h !== null)
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .slice(0, LIMITE_VERSOES);

  const rascunho = objeto(dados.rascunho);
  const stage = STAGES.includes(rascunho.stage as Stage) ? (rascunho.stage as Stage) : "setup";

  const arquivo: ArquivoBackup = {
    formato: FORMATO_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm: numero(o.exportadoEm, Date.now()),
    aplicativo: texto(o.aplicativo, 100) || "Redação Nota Máxima AI",
    dados: {
      historico,
      favoritos: limparListaTexto(dados.favoritos, LIMITE_FAVORITOS),
      checklist: limparChecklist(dados.checklist),
      rascunho: {
        tema: limparTema(rascunho.tema),
        tese: texto(rascunho.tese, 3000),
        argumentos: limparArgumentos(rascunho.argumentos),
        intervencao: limparIntervencao(rascunho.intervencao),
        textoFinal: texto(rascunho.textoFinal),
        stage,
      },
    },
  };

  return { ok: true, arquivo };
}

export function lerBackupJson(conteudo: string): ResultadoValidacao {
  try {
    return validarBackup(JSON.parse(conteudo));
  } catch {
    return {
      ok: false,
      erro: "Não consegui ler o arquivo. Confirme que é um .json válido e não foi editado.",
    };
  }
}

// ---------------------------------------------------------------------------
// Mesclagem (sem duplicatas, sem perder o rascunho atual)
// ---------------------------------------------------------------------------

function chaveVersao(h: RedacaoSalva): string {
  return `${h.titulo.trim()}\u0000${h.texto.trim()}`;
}

function semDuplicatas(items: RedacaoSalva[]): RedacaoSalva[] {
  const porChave = new Map<string, RedacaoSalva>();
  for (const item of items) {
    const chave = chaveVersao(item);
    const atual = porChave.get(chave);
    if (!atual || item.criadoEm > atual.criadoEm) porChave.set(chave, item);
  }
  return Array.from(porChave.values())
    .sort((a, b) => b.criadoEm - a.criadoEm)
    .slice(0, LIMITE_HISTORICO_APP);
}

function estadoComoDados(estado: EstadoParaBackup): DadosPessoais {
  return {
    historico: estado.historico,
    favoritos: estado.favoritos,
    checklist: estado.checklist,
    rascunho: {
      tema: estado.tema,
      tese: estado.tese,
      argumentos: estado.argumentos,
      intervencao: estado.intervencao,
      textoFinal: estado.textoFinal,
      stage: estado.stage,
    },
  };
}

/**
 * - "mesclar" (padrão): junta históricos sem duplicar, une favoritos/checklist
 *   e NUNCA apaga um rascunho que você está escrevendo agora.
 * - "substituir": troca tudo pelo conteúdo do arquivo (o UI exige confirmação).
 */
export function mesclarDados(
  atual: EstadoParaBackup,
  importado: DadosPessoais,
  modo: ModoRestauracao
): DadosPessoais {
  const aqui = estadoComoDados(atual);
  if (modo === "substituir") {
    return {
      historico: semDuplicatas(importado.historico),
      favoritos: importado.favoritos.slice(0, LIMITE_FAVORITOS),
      checklist: importado.checklist.filter((id) => IDS_CHECKLIST.has(id)),
      rascunho: importado.rascunho,
    };
  }

  const escrevendoAgora = aqui.rascunho.textoFinal.trim().length > 0;
  return {
    historico: semDuplicatas([...aqui.historico, ...importado.historico]),
    favoritos: Array.from(new Set([...aqui.favoritos, ...importado.favoritos])).slice(
      0,
      LIMITE_FAVORITOS
    ),
    checklist: Array.from(new Set([...aqui.checklist, ...importado.checklist])).filter((id) =>
      IDS_CHECKLIST.has(id)
    ),
    // Só adota o rascunho do arquivo se não houver texto em andamento aqui.
    rascunho: escrevendoAgora ? aqui.rascunho : importado.rascunho,
  };
}
