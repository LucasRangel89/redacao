#!/usr/bin/env node
/**
 * Valida a integridade de src/data/repertorios-verificados.json.
 *
 * Regras (critérios de aceite do item P0.2):
 *  - campos obrigatórios presentes e não vazios;
 *  - ids únicos;
 *  - autor + fonte sempre preenchidos (nada pode ganhar o selo sem origem);
 *  - URL https de domínio institucional permitido;
 *  - enums conhecidos, ano plausível, data de verificação ISO;
 *  - paráfrases precisam estar rotuladas como tal;
 *  - citação literal exige fonte primária.
 *
 * Exporta `validarRepertorios` para os testes (node --test) e roda como CLI.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CAMINHO_DADOS = resolve(ROOT, "src/data/repertorios-verificados.json");

export const DOMINIOS_PERMITIDOS = [
  "planalto.gov.br",
  "gov.br",
  "ibge.gov.br",
  "ipea.gov.br",
  "ohchr.org",
  "stanford.edu",
  "pt.wikipedia.org",
];

const TIPOS = new Set(["filosofico", "sociologico", "dados", "historico", "legal", "cultural"]);
const NATUREZAS = new Set(["norma", "dado", "citacao", "paráfrase"]);
const NIVEIS = new Set(["primaria", "secundaria"]);
const CAMPOS_TEXTO = ["id", "texto", "autor", "fonte", "url", "verificadoEm", "area", "comoUsar"];

/**
 * @param {unknown[]} dados
 * @returns {{ erros: string[], validos: number }}
 */
export function validarRepertorios(dados) {
  const erros = [];
  if (!Array.isArray(dados) || dados.length === 0) {
    return { erros: ["O dataset deve ser um array não vazio."], validos: 0 };
  }

  const vistos = new Set();
  const anoAtual = new Date().getFullYear();
  let validos = 0;

  dados.forEach((item, i) => {
    const p = `item ${i + 1} (${typeof item?.id === "string" ? item.id : "sem id"})`;
    const errosAntes = erros.length;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      erros.push(`${p}: não é um objeto.`);
      return;
    }

    for (const campo of CAMPOS_TEXTO) {
      if (typeof item[campo] !== "string" || item[campo].trim() === "") {
        erros.push(`${p}: campo obrigatório "${campo}" ausente ou vazio.`);
      }
    }
    if (vistos.has(item.id)) erros.push(`${p}: id duplicado "${item.id}".`);
    vistos.add(item.id);

    if (typeof item.tipo !== "string" || !TIPOS.has(item.tipo)) {
      erros.push(`${p}: tipo "${item.tipo}" é inválido.`);
    }
    if (typeof item.natureza !== "string" || !NATUREZAS.has(item.natureza)) {
      erros.push(`${p}: natureza "${item.natureza}" é inválida.`);
    }
    if (typeof item.nivelFonte !== "string" || !NIVEIS.has(item.nivelFonte)) {
      erros.push(`${p}: nivelFonte "${item.nivelFonte}" é inválido.`);
    }
    if (!Number.isInteger(item.ano) || item.ano < 1500 || item.ano > anoAtual) {
      erros.push(`${p}: ano "${item.ano}" fora do intervalo plausível.`);
    }
    if (typeof item.verificadoEm === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(item.verificadoEm)) {
      erros.push(`${p}: verificadoEm deve estar em YYYY-MM-DD.`);
    } else if (typeof item.verificadoEm === "string" && new Date(`${item.verificadoEm}T00:00:00Z`) > new Date()) {
      erros.push(`${p}: verificadoEm não pode estar no futuro.`);
    }

    if (typeof item.url === "string") {
      try {
        const u = new URL(item.url);
        const host = u.hostname.toLowerCase();
        if (u.protocol !== "https:") erros.push(`${p}: URL precisa usar https.`);
        const permitido = DOMINIOS_PERMITIDOS.some(
          (d) => host === d || host.endsWith(`.${d}`)
        );
        if (!permitido) erros.push(`${p}: domínio "${host}" fora da lista de fontes permitidas.`);
      } catch {
        erros.push(`${p}: URL inválida.`);
      }
    }

    if (typeof item.texto === "string" && item.texto.trim().length < 40) {
      erros.push(`${p}: texto curto demais para ser um repertório útil.`);
    }
    if (typeof item.comoUsar === "string" && item.comoUsar.trim().length < 30) {
      erros.push(`${p}: comoUsar precisa orientar o estudante (mín. 30 caracteres).`);
    }

    // Honestidade bibliográfica.
    if (item.natureza === "paráfrase") {
      const rotulo = `${item.fonte ?? ""} ${item.comoUsar ?? ""} ${item.observacao ?? ""}`.toLowerCase();
      if (!rotulo.includes("paráfrase")) {
        erros.push(`${p}: paráfrase precisa estar explicitamente rotulada.`);
      }
    }
    if (item.natureza === "citacao" && item.nivelFonte !== "primaria") {
      erros.push(`${p}: citação literal exige fonte primária.`);
    }

    if (erros.length === errosAntes) validos += 1;
  });

  return { erros, validos };
}

function main() {
  const dados = JSON.parse(readFileSync(CAMINHO_DADOS, "utf8"));
  const { erros } = validarRepertorios(dados);
  if (erros.length) {
    console.error(`✗ ${erros.length} problema(s) no banco de repertórios:\n`);
    for (const e of erros) console.error(`  - ${e}`);
    process.exit(1);
  }
  const primarias = dados.filter((r) => r.nivelFonte === "primaria").length;
  console.info(
    `✓ ${dados.length} repertórios verificados · ${primarias} com fonte primária · ${dados.length - primarias} obras de referência.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
