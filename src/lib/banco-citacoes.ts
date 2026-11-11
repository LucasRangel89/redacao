/**
 * Adaptador tipado do Banco de Citações (LucasRangel89/citacoes) para o Redação.
 *
 * O JSON local é atualizado por scripts/sync-banco-citacoes.mjs. A página não
 * depende de uma requisição externa para funcionar: o acervo vai no build.
 */
import dados from "@/data/banco-citacoes.json";
import { normalizar, type Citacao, type TipoCitacao } from "@/lib/recursos";

export const URL_BANCO_CITACOES = "https://lucasrangel89.github.io/citacoes/";
export const URL_REPOSITORIO_BANCO = "https://github.com/LucasRangel89/citacoes";

export const TAGS_TIPO_BANCO = [
  { tag: "#tipo-filosofica", value: "filosofico", label: "Filosófica" },
  { tag: "#tipo-cientifica", value: "cientifico", label: "Científica" },
  { tag: "#tipo-juridica", value: "legal", label: "Jurídica" },
  { tag: "#tipo-literaria", value: "literario", label: "Literária" },
  { tag: "#tipo-historica", value: "historico", label: "Histórica" },
] as const satisfies { tag: string; value: TipoCitacao; label: string }[];

export const TAGS_USO_BANCO = [
  { tag: "#uso-introducao", label: "Introdução" },
  { tag: "#uso-tese", label: "Tese" },
  { tag: "#uso-desenvolvimento", label: "Desenvolvimento" },
  { tag: "#uso-contrargumento", label: "Contrargumento" },
  { tag: "#uso-conclusao", label: "Conclusão" },
] as const;

export const TAGS_ARGUMENTO_BANCO = [
  { tag: "#arg-justica", label: "Justiça" },
  { tag: "#arg-dignidade-humana", label: "Dignidade humana" },
  { tag: "#arg-eficiencia", label: "Eficiência" },
  { tag: "#arg-participacao", label: "Participação" },
  { tag: "#arg-solidariedade", label: "Solidariedade" },
  { tag: "#arg-igualdade", label: "Igualdade" },
  { tag: "#arg-liberdade", label: "Liberdade" },
  { tag: "#arg-prevencao", label: "Prevenção" },
] as const;

export const TAGS_TOM_BANCO = [
  { tag: "#tom-formal", label: "Formal" },
  { tag: "#tom-critico", label: "Crítico" },
  { tag: "#tom-reflexivo", label: "Reflexivo" },
  { tag: "#tom-propositivo", label: "Propositivo" },
] as const;

export interface RegistroBancoCitacao {
  id: string;
  eixo: string;
  citacao: string;
  autor: string;
  fonte: string;
  ano?: string;
  pagina?: string;
  conceito_chave?: string;
  tags: string[];
  tema_principal?: string;
  como_usar: string;
  verificacao: "#fonte-confirmada" | "#verificar-fonte";
  autor_info?: string;
  autor_artigo?: string;
  autor_tipo?: "pessoa" | "norma" | "instituicao";
}

export type CitacaoBanco = Citacao & {
  origem: "banco";
  bancoId: string;
  eixo: string;
  conceitoChave: string;
  temaPrincipal: string;
  comoUsar: string;
  verificacao: "#fonte-confirmada" | "#verificar-fonte";
  tags: string[];
  autorInfo: string;
  autorArtigo: string;
  autorTipo: "pessoa" | "norma" | "instituicao";
};

const TIPO_POR_TAG: Record<string, TipoCitacao> = Object.fromEntries(
  TAGS_TIPO_BANCO.map(({ tag, value }) => [tag, value])
) as Record<string, TipoCitacao>;

const registros = dados as RegistroBancoCitacao[];

export const bancoCitacoes: CitacaoBanco[] = registros.map((item) => {
  const tagTipo = item.tags.find((tag) => tag.startsWith("#tipo-"));
  return {
    id: `banco:${item.id}`,
    bancoId: item.id,
    origem: "banco",
    texto: item.citacao,
    autor: item.autor,
    fonte: item.fonte,
    tipo: TIPO_POR_TAG[tagTipo ?? ""] ?? "sociologico",
    temaId: "",
    area: item.eixo,
    eixo: item.eixo,
    ...(item.ano ? { ano: item.ano } : {}),
    ...(item.pagina ? { pagina: item.pagina } : {}),
    conceitoChave: item.conceito_chave ?? item.tema_principal ?? "",
    temaPrincipal: item.tema_principal ?? "",
    comoUsar: item.como_usar,
    verificacao: item.verificacao,
    tags: item.tags,
    autorInfo: item.autor_info ?? "",
    autorArtigo: item.autor_artigo ?? "",
    autorTipo: item.autor_tipo ?? "pessoa",
  };
});

export const TOTAL_CITACOES_BANCO = bancoCitacoes.length;
export const EIXOS_BANCO = Array.from(new Set(bancoCitacoes.map((item) => item.eixo))).sort(
  (a, b) => a.localeCompare(b, "pt-BR")
);

export const TOTAL_FONTE_CONFIRMADA_BANCO = bancoCitacoes.filter(
  (item) => item.verificacao === "#fonte-confirmada"
).length;
export const TOTAL_CONFERIR_FONTE_BANCO = bancoCitacoes.filter(
  (item) => item.verificacao === "#verificar-fonte"
).length;

export interface FiltrosBancoCitacoes {
  consulta?: string;
  eixo?: string;
  tipo?: string;
  uso?: string;
  verificacao?: string;
}

/** Busca sem acentos em todos os campos pedagógicos do Banco. */
export function buscarCitacoesBanco({
  consulta = "",
  eixo = "Todas",
  tipo = "todos",
  uso = "todos",
  verificacao = "todos",
}: FiltrosBancoCitacoes = {}): CitacaoBanco[] {
  const termos = normalizar(consulta).split(" ").filter((termo) => termo.length >= 2);

  return bancoCitacoes.filter((item) => {
    if (eixo !== "Todas" && item.eixo !== eixo) return false;
    if (tipo !== "todos" && !item.tags.includes(tipo)) return false;
    if (uso !== "todos" && !item.tags.includes(uso)) return false;
    if (verificacao !== "todos" && item.verificacao !== verificacao) return false;
    if (termos.length === 0) return true;

    const textoBusca = normalizar(
      [
        item.bancoId,
        item.eixo,
        item.texto,
        item.autor,
        item.autorInfo,
        item.fonte,
        item.ano,
        item.pagina,
        item.conceitoChave,
        item.temaPrincipal,
        item.comoUsar,
        item.tags.join(" "),
      ].join(" ")
    );
    return termos.every((termo) => textoBusca.includes(termo));
  });
}

export type NaturezaCitacaoBanco = "citacao" | "parafrase" | "alusao";

export function naturezaCitacaoBanco(citacao: CitacaoBanco): NaturezaCitacaoBanco {
  if (/\(Alusão\s+literária\)$/i.test(citacao.texto)) return "alusao";
  if (/\(Paráfrase(?:\s+conceitual)?\)$/i.test(citacao.texto)) return "parafrase";
  return "citacao";
}

/** Retira o marcador editorial do fim do texto, preservando a informação na UI. */
export function textoLimpoBanco(citacao: CitacaoBanco): string {
  return citacao.texto
    .replace(/\s*\((?:Paráfrase(?:\s+conceitual)?|Alusão\s+literária)\)$/i, "")
    .trim();
}

function fonteEmLinha(citacao: CitacaoBanco): string {
  return [citacao.fonte, citacao.ano, citacao.pagina].filter(Boolean).join(", ");
}

function minusculeInicial(texto: string): string {
  return texto ? texto.charAt(0).toLocaleLowerCase("pt-BR") + texto.slice(1) : texto;
}

function pontuarParagrafo(texto: string): string {
  const limpo = texto.trim();
  return /[.!?…]$/.test(limpo) ? limpo : `${limpo}.`;
}

/**
 * Produz uma frase-modelo com referência e aposto. Paráfrases e alusões são
 * deliberadamente escritas sem aspas para não parecerem transcrições literais.
 */
export function formatarCitacaoParaRedacao(citacao: CitacaoBanco): string {
  const texto = textoLimpoBanco(citacao);
  const fonte = fonteEmLinha(citacao);
  const informacaoAutor = citacao.autorInfo.trim();
  const artigo = citacao.autorArtigo.trim();
  const tipoAutor = citacao.autorTipo;
  const autorComArtigo = artigo ? `${artigo} ${citacao.autor}` : citacao.autor;
  const aposto = informacaoAutor ? `, ${informacaoAutor}` : "";
  const referencia = fonte ? ` (${fonte})` : "";

  if (naturezaCitacaoBanco(citacao) === "alusao") {
    let alusao = texto;
    if (citacao.fonte) {
      const fonteEscapada = citacao.fonte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      alusao = alusao.replace(new RegExp(`^Em\\s+${fonteEscapada},\\s*`, "i"), "");
    }
    const refObra = fonte || citacao.autor;
    const credencial = informacaoAutor ? `, ${informacaoAutor}` : "";
    return pontuarParagrafo(
      `Na obra ${refObra}, de ${citacao.autor}${credencial}, observa-se que ${minusculeInicial(alusao)}`
    );
  }

  if (naturezaCitacaoBanco(citacao) === "parafrase") {
    if (tipoAutor === "norma") {
      return pontuarParagrafo(
        `Conforme dispõe ${autorComArtigo}${aposto}${referencia}, ${minusculeInicial(texto)}`
      );
    }
    if (tipoAutor === "instituicao") {
      return pontuarParagrafo(
        `Segundo ${autorComArtigo}${aposto}${referencia}, ${minusculeInicial(texto)}`
      );
    }
    const credencial =
      informacaoAutor && !informacaoAutor.includes(",")
        ? `${artigo ? `${artigo} ` : ""}${informacaoAutor} ${citacao.autor}`
        : `${citacao.autor}${aposto}`;
    return pontuarParagrafo(`Segundo ${credencial}${referencia}, ${minusculeInicial(texto)}`);
  }

  const transcricao = /[.!?…]$/.test(texto) ? texto : `${texto}.`;
  if (tipoAutor === "norma") {
    return `Conforme dispõe ${autorComArtigo}${aposto}${referencia}, “${transcricao}”`;
  }
  if (tipoAutor === "instituicao") {
    return `Segundo ${autorComArtigo}${aposto}${referencia}, “${transcricao}”`;
  }
  if (informacaoAutor && !informacaoAutor.includes(",")) {
    const credencial = artigo ? `${artigo} ${informacaoAutor} ${citacao.autor}` : `${informacaoAutor} ${citacao.autor}`;
    return `Segundo ${credencial}${referencia}, “${transcricao}”`;
  }
  return `Segundo ${citacao.autor}${aposto}${referencia}, “${transcricao}”`;
}

export function rotuloTagBanco(tag: string): string {
  const tipo = TAGS_TIPO_BANCO.find((item) => item.tag === tag);
  if (tipo) return tipo.label;
  const uso = TAGS_USO_BANCO.find((item) => item.tag === tag);
  if (uso) return `Uso: ${uso.label.toLocaleLowerCase("pt-BR")}`;
  const argumento = TAGS_ARGUMENTO_BANCO.find((item) => item.tag === tag);
  if (argumento) return `Argumento: ${argumento.label.toLocaleLowerCase("pt-BR")}`;
  const tom = TAGS_TOM_BANCO.find((item) => item.tag === tag);
  if (tom) return `Tom: ${tom.label.toLocaleLowerCase("pt-BR")}`;
  return tag.replace(/^#/, "").replaceAll("-", " ");
}
