#!/usr/bin/env node
/**
 * Converte o acervo markdown (docs/acervo-redacoes.md) em dados estruturados
 * usados pela Biblioteca e pelo modo local/offline do app.
 *
 * Uso: node scripts/parse-recursos.mjs
 * Saída: src/data/recursos.json
 *
 * O acervo original continua sendo a fonte da verdade; este script é
 * determinístico e pode ser reexecutado após qualquer edição do markdown.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INPUT = resolve(ROOT, "docs/acervo-redacoes.md");
const OUTPUT = resolve(ROOT, "src/data/recursos.json");

const REGRAS_AREA = [
  ["Tecnologia e Sociedade", ["privacidade", "sigilo", "tecnologia", "desmonetiza", "digital"]],
  ["Educação", ["educação", "pandemia", "escola"]],
  ["Cidadania e Direitos", ["cidadão", "objetivos de desenvolvimento", "ods", "direitos"]],
  ["Economia e Trabalho", ["trabalho", "financeira", "funcionário", "empresas", "laboral"]],
  ["Meio Ambiente", ["sustent", "ambiente", "clima"]],
];

const FILOSOFOS = [
  "socrates", "platão", "aristóteles", "kant", "nietzsche", "heidegger", "foucault",
  "bauman", "habermas", "dewey", "freire", "marx", "durkheim", "weber", "bakhtin",
  "hannah arendt", "solove", "scriven", "westin", "brandeis", "snowden", "turkle",
  "carr", "judith martin", "-flusser", "adam smith", "confúcio",
];

const INSTITUICOES = [
  "onu", "organização das nações", "comissão", "conselho de direitos", "ministério",
  "supremo tribunal", "tribunal", "união europeia", "corte interamericana", "unesco",
  "edri", "cidh", "constituição", "lgpd", "gdpr", "resolução", "relatório da",
  "agenda 2030", "declaração universal",
];

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/** Remove escapes e marcadores markdown do acervo. */
function limpar(texto) {
  return texto
    .replace(/\\\./g, ".")
    .replace(/\\-/g, "-")
    .replace(/\\([_*#()[\]])/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+$/g, "")
    .trim();
}

function semAspas(texto) {
  return texto.replace(/^["“”'«]+/, "").replace(/["“”'»]+$/, "").trim();
}

function ehCitacao(linha) {
  return /\\-|^\s*["“].*["”]\s*-\s/.test(linha);
}

function ehRotulo(linha) {
  return /^\*\*(Introdução|Desenvolvimento|Conclusão|Citações|Tema)\b/i.test(linha.trim());
}

function ehFecho(linha) {
  return /^(em conclusão|em resumo|em suma|em síntese|por fim|em última análise|diante disso|nesse sentido, conclui)/i.test(
    limpar(linha)
  );
}

function classificarArea(titulo) {
  const t = titulo.toLowerCase();
  for (const [area, chaves] of REGRAS_AREA) {
    if (chaves.some((c) => t.includes(c))) return area;
  }
  return "Geral";
}

function classificarTipoCitacao(texto, autor) {
  const alvo = `${texto} ${autor}`.toLowerCase();
  if (INSTITUICOES.some((i) => alvo.includes(i))) return "legal";
  if (/estatístic|\bíndice\b|\bpercentual\b|\bdados do\b|\bpesquisa\b|\bcenso\b/.test(alvo)) return "dados";
  if (/filme|livro|série|romancista|escritor|poeta|obra/.test(alvo)) return "cultural";
  if (/filósofo|filósof|sociólog|professor|pensador|psicólog/.test(alvo)) return "filosofico";
  if (FILOSOFOS.some((f) => alvo.includes(f))) return "filosofico";
  if (/século|história|1890|1967|revolução industrial/.test(alvo)) return "historico";
  return "sociologico";
}

function etiquetaParagrafo(texto, indice, total) {
  if (ehFecho(texto) || indice === total - 1) return "Conclusão";
  if (indice === 0) return "Introdução";
  return "Desenvolvimento";
}

function resumoDe(texto, tamanho = 240) {
  const limpo = limpar(texto);
  const corte = limpo.search(/(?<=[.!?])\s/);
  const frase = corte > 40 ? limpo.slice(0, corte + 1) : limpo.slice(0, tamanho);
  return frase.length > tamanho ? `${frase.slice(0, tamanho).trimEnd()}…` : frase;
}

function parseSecao(linhas, indiceSecao) {
  const naoVazias = linhas.filter((l) => l.trim() && l.trim() !== "---");
  const primeira = naoVazias[0] ?? `Tema ${indiceSecao + 1}`;
  const tituloBruto = limpar(primeira).replace(/^Tema:\s*/i, "");
  const titulo =
    tituloBruto === tituloBruto.toUpperCase()
      ? tituloBruto
          .toLowerCase()
          .replace(/^./, (c) => c.toUpperCase())
      : tituloBruto;

  const linhaTema = naoVazias.find((l) => /^\*\*Tema:/i.test(l.trim()));
  const enunciado = linhaTema ? limpar(linhaTema).replace(/^Tema:\s*/i, "") : titulo;

  const citacoes = [];
  const redacoes = [];
  let atual = [];
  let tituloRedacao = "Versão 1";

  const paragrafosDe = (bloco) =>
    bloco.map((texto, i) => ({ texto, etiqueta: etiquetaParagrafo(texto, i, bloco.length) }));

  const finalizar = () => {
    if (atual.length === 0) return;
    // Blocos muito curtos são fragmentos do texto anterior, não uma nova redação.
    if (atual.length < 3 && redacoes.length > 0) {
      const anterior = redacoes[redacoes.length - 1];
      anterior.paragrafos = paragrafosDe([
        ...anterior.paragrafos.map((p) => p.texto),
        ...atual,
      ]);
      atual = [];
      return;
    }
    redacoes.push({
      id: `r${indiceSecao + 1}-${redacoes.length + 1}`,
      titulo: tituloRedacao,
      paragrafos: paragrafosDe(atual),
    });
    atual = [];
    tituloRedacao = `Versão ${redacoes.length + 1}`;
  };

  for (const linha of naoVazias.slice(1)) {
    const bruto = linha.trim();

    if (ehCitacao(bruto)) {
      const partes = bruto.split(/\\-|(?<!\\)-\s(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
      const texto = semAspas(limpar(partes[0] ?? "").replace(/^["“]+/, ""));
      const fonteBruta = limpar(partes.slice(1).join(" - ")).replace(/^\s*-\s*/, "");
      if (!texto) continue;
      const autor = fonteBruta.split(/,|\s+-\s+|\(|\sem um\s|\sque\s/)[0].trim().slice(0, 80);
      citacoes.push({
        id: `c${indiceSecao + 1}-${citacoes.length + 1}`,
        texto,
        autor: autor || "Autor não identificado",
        fonte: fonteBruta.slice(0, 260),
        tipo: classificarTipoCitacao(texto, fonteBruta),
      });
      continue;
    }

    if (ehRotulo(bruto)) {
      if (/^\*\*Tema:/i.test(bruto) || /^\*\*[A-Z]\*\*/.test(bruto)) {
        finalizar();
        if (/^\*\*Tema:/i.test(bruto)) tituloRedacao = `Versão ${redacoes.length + 1} · ${limpar(bruto).replace(/^Tema:\s*/i, "").slice(0, 70)}`;
      }
      // Rótulos puros (**Introdução**:) não viram parágrafos.
      if (/^\*\*[A-Z]\*\*/.test(bruto)) atual.push(limpar(bruto));
      continue;
    }

    const texto = limpar(bruto);
    if (texto.length < 40) continue;

    // Fecho de redação: encerra o bloco atual.
    if (atual.length >= 2 && ehFecho(texto)) {
      atual.push(texto);
      finalizar();
      continue;
    }
    // Segurança: blocos muito longos são divididos.
    if (atual.length >= 8) finalizar();
    atual.push(texto);
  }
  finalizar();

  const id = slugify(titulo) || `tema-${indiceSecao + 1}`;
  const area = classificarArea(`${titulo} ${enunciado}`);
  const primeiroParagrafo = redacoes[0]?.paragrafos[0]?.texto ?? "";
  const resumo = resumoDe(primeiroParagrafo);
  const enunciadoEnem = `${enunciado.replace(/[.!?]+$/, "")}: apresente proposta de intervenção para o problema discutido, respeitando os direitos humanos.`;
  const palavrasChave = Array.from(
    new Set(
      `${titulo} ${enunciado}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[^a-z0-9]+/)
        .filter((p) => p.length >= 5 && !["sobre", "entre", "quando", "ainda", "tema", "brasil", "papel"].includes(p))
        .slice(0, 12)
    )
  );

  const textosMotivadores = [
    citacoes[0]
      ? { fonte: `Citação — ${citacoes[0].autor}`, resumo: citacoes[0].texto.slice(0, 220) }
      : { fonte: "Texto motivador — acervo do projeto", resumo },
    {
      fonte: "Texto motivador — acervo do projeto",
      resumo: resumoDe(redacoes[0]?.paragrafos[1]?.texto ?? primeiroParagrafo, 260),
    },
  ];

  return {
    id,
    titulo,
    enunciado: enunciadoEnem,
    area,
    resumo,
    palavrasChave,
    textosMotivadores,
    redacoes,
    citacoes: citacoes.map((c) => ({ ...c, temaId: id, area })),
  };
}

const conteudo = readFileSync(INPUT, "utf8");
const linhas = conteudo.split(/\r?\n/);
const secoes = [];
let buffer = [];
for (const linha of linhas) {
  if (linha.trim() === "---") {
    if (buffer.some((l) => l.trim())) secoes.push(buffer);
    buffer = [];
  } else {
    buffer.push(linha);
  }
}
if (buffer.some((l) => l.trim())) secoes.push(buffer);

const temas = secoes.map(parseSecao);
const citacoes = temas.flatMap((t) => t.citacoes);
const dados = {
  fonte: "docs/acervo-redacoes.md",
  geradoPor: "scripts/parse-recursos.mjs",
  totalTemas: temas.length,
  totalCitacoes: citacoes.length,
  totalRedacoes: temas.reduce((acc, t) => acc + t.redacoes.length, 0),
  temas: temas.map(({ citacoes: _c, ...t }) => ({
    ...t,
    citacoes: citacoes.filter((c) => c.temaId === t.id).map((c) => c.id),
  })),
  citacoes,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
console.info(
  `✓ ${dados.totalTemas} temas · ${dados.totalRedacoes} redações modelo · ${dados.totalCitacoes} citações → src/data/recursos.json`
);
