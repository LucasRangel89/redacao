#!/usr/bin/env node
/**
 * Sincroniza o JSON público do repositório LucasRangel89/citacoes.
 *
 * O arquivo local é mantido no Git como cópia de segurança para desenvolvimento
 * offline. O deploy do Redação atualiza essa cópia a partir da main do Banco antes
 * de compilar o site estático.
 *
 * Uso:
 *   npm run sincronizar:banco  # busca a versão publicada no GitHub
 *   npm run validar:banco      # valida a cópia local, sem acessar a rede
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CAMINHO_DADOS = resolve(ROOT, "src/data/banco-citacoes.json");
export const URL_API_BANCO =
  "https://api.github.com/repos/LucasRangel89/citacoes/contents/citacoes.json?ref=main";

const VERIFICACOES = new Set(["#fonte-confirmada", "#verificar-fonte"]);
const TIPOS = new Set([
  "#tipo-filosofica",
  "#tipo-cientifica",
  "#tipo-juridica",
  "#tipo-literaria",
  "#tipo-historica",
]);
const TIPOS_AUTOR = new Set(["pessoa", "norma", "instituicao"]);

/** Valida o contrato mínimo consumido pelo Redação sem classificar a curadoria. */
export function validarBancoCitacoes(dados) {
  const erros = [];
  if (!Array.isArray(dados) || dados.length === 0) {
    return { erros: ["O Banco precisa fornecer uma lista não vazia de citações."], validos: 0 };
  }

  const ids = new Set();
  let validos = 0;

  dados.forEach((item, indice) => {
    const identificador = typeof item?.id === "string" ? item.id : `item ${indice + 1}`;
    const prefixo = `Citação ${identificador}`;
    const errosAntes = erros.length;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      erros.push(`${prefixo}: registro inválido.`);
      return;
    }

    for (const campo of ["id", "eixo", "citacao", "autor", "fonte", "como_usar"]) {
      if (typeof item[campo] !== "string" || item[campo].trim() === "") {
        erros.push(`${prefixo}: campo obrigatório "${campo}" ausente.`);
      }
    }

    if (typeof item.id === "string") {
      if (ids.has(item.id)) erros.push(`${prefixo}: ID duplicado.`);
      ids.add(item.id);
    }

    if (!Array.isArray(item.tags) || item.tags.length === 0 || item.tags.some((tag) => typeof tag !== "string")) {
      erros.push(`${prefixo}: tags precisa ser uma lista de textos.`);
    } else {
      const tipos = item.tags.filter((tag) => tag.startsWith("#tipo-"));
      if (tipos.length !== 1 || !TIPOS.has(tipos[0])) {
        erros.push(`${prefixo}: precisa ter exatamente uma tag de tipo reconhecida.`);
      }
      if (typeof item.verificacao === "string" && !item.tags.includes(item.verificacao)) {
        erros.push(`${prefixo}: a tag de verificação não aparece em tags.`);
      }
    }

    if (typeof item.verificacao !== "string" || !VERIFICACOES.has(item.verificacao)) {
      erros.push(`${prefixo}: status de verificação desconhecido.`);
    }
    if (item.autor_tipo !== undefined && !TIPOS_AUTOR.has(item.autor_tipo)) {
      erros.push(`${prefixo}: tipo de autor desconhecido.`);
    }
    for (const campo of ["ano", "pagina", "conceito_chave", "tema_principal", "autor_info", "autor_artigo"]) {
      if (item[campo] !== undefined && typeof item[campo] !== "string") {
        erros.push(`${prefixo}: campo "${campo}" precisa ser texto.`);
      }
    }

    if (erros.length === errosAntes) validos += 1;
  });

  return { erros, validos };
}

async function baixarBanco() {
  let resposta;
  try {
    resposta = await fetch(URL_API_BANCO, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "redacao-banco-citacoes-sync",
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (erro) {
    const detalhe = erro instanceof Error && erro.cause instanceof Error
      ? erro.cause.message
      : erro instanceof Error
        ? erro.message
        : String(erro);
    throw new Error(`Não foi possível acessar o GitHub para atualizar o Banco: ${detalhe}`);
  }

  if (!resposta.ok) {
    throw new Error(`GitHub respondeu HTTP ${resposta.status} ao buscar o Banco.`);
  }

  const arquivo = await resposta.json();
  if (arquivo.encoding !== "base64" || typeof arquivo.content !== "string") {
    throw new Error("A resposta do GitHub não contém o JSON do Banco em formato esperado.");
  }

  const texto = Buffer.from(arquivo.content.replace(/\s/g, ""), "base64").toString("utf8");
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error("O arquivo publicado pelo Banco não é um JSON válido.");
  }

  const { erros, validos } = validarBancoCitacoes(dados);
  if (erros.length > 0) {
    throw new Error(`O Banco publicado não passou na validação:\n- ${erros.join("\n- ")}`);
  }

  writeFileSync(CAMINHO_DADOS, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
  console.info(`✓ Banco sincronizado: ${validos} citações (SHA do arquivo ${String(arquivo.sha).slice(0, 7)}).`);
}

function validarCopiaLocal() {
  let dados;
  try {
    dados = JSON.parse(readFileSync(CAMINHO_DADOS, "utf8"));
  } catch (erro) {
    throw new Error(`Não foi possível ler ${CAMINHO_DADOS}: ${erro.message}`);
  }

  const { erros, validos } = validarBancoCitacoes(dados);
  if (erros.length > 0) {
    throw new Error(`A cópia local do Banco não passou na validação:\n- ${erros.join("\n- ")}`);
  }
  console.info(`✓ Cópia local válida: ${validos} citações.`);
}

async function main() {
  if (process.argv.includes("--check")) {
    validarCopiaLocal();
    return;
  }
  await baixarBanco();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(`✗ ${erro instanceof Error ? erro.message : String(erro)}`);
    process.exitCode = 1;
  });
}
