/**
 * Testes do item P0.1 (portabilidade de dados sem login).
 * Rode com: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMATO_BACKUP,
  VERSAO_BACKUP,
  gerarBackup,
  lerBackupJson,
  mesclarDados,
  nomeArquivoBackup,
  resumoBackup,
  serializarBackup,
  validarBackup,
  type EstadoParaBackup,
} from "@/lib/backup";
import type { RedacaoSalva } from "@/lib/types";

function versao(id: string, texto: string, criadoEm: number): RedacaoSalva {
  return {
    id,
    criadoEm,
    titulo: `Tema ${id}`,
    area: "Educação",
    texto,
    tese: "Tese de exemplo",
    argumentos: [],
    intervencao: {
      agente: "Ministério",
      acao: "deve agir",
      meio: "por lei",
      finalidade: "para melhorar",
      detalhamento: "com metas",
    },
    palavras: texto.split(/\s+/).length,
    linhas: 10,
    paragrafos: 4,
    tempoSegundos: 120,
  };
}

function estado(sobrescrever: Partial<EstadoParaBackup> = {}): EstadoParaBackup {
  return {
    historico: [versao("a", "Primeiro texto de exemplo com algumas palavras.", 1000)],
    favoritos: ["tema:t1", "cit:c1"],
    checklist: ["ch1", "ch2"],
    tema: {
      titulo: "Tema de teste",
      area: "Educação",
      textosMotivadores: [{ fonte: "Fonte", resumo: "Resumo" }],
    },
    tese: "Minha tese",
    argumentos: [],
    intervencao: {
      agente: "",
      acao: "",
      meio: "",
      finalidade: "",
      detalhamento: "",
    },
    textoFinal: "Rascunho atual em andamento.",
    stage: "escrita",
    ...sobrescrever,
  };
}

test("backup gerado tem formato, versão e dados esperados", () => {
  const arquivo = gerarBackup(estado(), 1_700_000_000_000);
  assert.equal(arquivo.formato, FORMATO_BACKUP);
  assert.equal(arquivo.versao, VERSAO_BACKUP);
  assert.equal(arquivo.exportadoEm, 1_700_000_000_000);
  assert.equal(arquivo.dados.historico.length, 1);
  assert.equal(arquivo.dados.checklist.length, 2);
  assert.equal(arquivo.dados.rascunho.stage, "escrita");
});

test("ida e volta: gerar → serializar → ler → validar preserva os dados", () => {
  const arquivo = gerarBackup(estado());
  const lido = lerBackupJson(serializarBackup(arquivo));
  assert.equal(lido.ok, true);
  if (!lido.ok) return;
  assert.equal(lido.arquivo.dados.historico.length, 1);
  assert.equal(lido.arquivo.dados.historico[0]!.texto, "Primeiro texto de exemplo com algumas palavras.");
  assert.deepEqual(lido.arquivo.dados.favoritos, ["tema:t1", "cit:c1"]);
  assert.equal(lido.arquivo.dados.rascunho.textoFinal, "Rascunho atual em andamento.");
});

test("validação rejeita arquivos estranhos com mensagem em português", () => {
  const casos: unknown[] = [
    null,
    {},
    { formato: "outro-app", versao: 1, dados: {} },
    { formato: FORMATO_BACKUP, versao: 99, dados: {} },
    { formato: FORMATO_BACKUP, versao: 1, dados: {} },
    { formato: FORMATO_BACKUP, versao: 1, dados: { historico: new Array(500).fill({}) } },
  ];
  for (const [i, bruto] of casos.entries()) {
    const r = validarBackup(bruto);
    assert.equal(r.ok, false, `caso ${i + 1} deveria falhar`);
    if (!r.ok) assert.ok(r.erro.length > 10);
  }
  const jsonInvalido = lerBackupJson("{ nao é json");
  assert.equal(jsonInvalido.ok, false);
  if (!jsonInvalido.ok) assert.match(jsonInvalido.erro, /Não consegui ler/);
});

test("campos são saneados: texto limitado, checklist desconhecido removido, stats recalculadas", () => {
  const bruto = {
    formato: FORMATO_BACKUP,
    versao: 1,
    dados: {
      historico: [
        {
          id: "x",
          texto: "a ".repeat(30_000),
          titulo: "Tema",
          palavras: 999999,
          notaEstimada: 5000,
        },
      ],
      favoritos: ["ok", 42, null, "ok"],
      checklist: ["ch1", "ch-inventado", "ch2"],
      rascunho: { stage: "inexistente", textoFinal: 123 },
    },
  };
  const r = validarBackup(bruto);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const h = r.arquivo.dados.historico[0]!;
  assert.ok(h.texto.length <= 20_000);
  assert.equal(h.palavras, h.texto.trim().split(/\s+/).length);
  assert.equal(h.notaEstimada, undefined, "nota fora de 0–1000 deve ser descartada");
  assert.deepEqual(r.arquivo.dados.favoritos, ["ok"]);
  assert.deepEqual(r.arquivo.dados.checklist, ["ch1", "ch2"]);
  assert.equal(r.arquivo.dados.rascunho.stage, "setup");
  assert.equal(r.arquivo.dados.rascunho.textoFinal, "");
});

test("mesclar junta sem duplicar e preserva o rascunho em andamento", () => {
  const atual = estado();
  const repetida = versao("a", "Primeiro texto de exemplo com algumas palavras.", 2000);
  const nova = versao("b", "Segundo texto totalmente diferente.", 3000);
  const importado = gerarBackup(
    estado({
      historico: [repetida, nova, nova],
      favoritos: ["cit:c1", "cit:c9"],
      checklist: ["ch2", "ch3"],
      textoFinal: "Texto que veio de outro aparelho.",
    })
  ).dados;

  const dados = mesclarDados(atual, importado, "mesclar");
  assert.equal(dados.historico.length, 2, "deve remover duplicatas pelo conteúdo");
  assert.ok(dados.historico.find((h) => h.id === "b"));
  assert.deepEqual(dados.favoritos, ["tema:t1", "cit:c1", "cit:c9"]);
  assert.deepEqual(dados.checklist.sort(), ["ch1", "ch2", "ch3"]);
  assert.equal(dados.rascunho.textoFinal, "Rascunho atual em andamento.");
});

test("mesclar adota o rascunho do arquivo quando não há texto atual", () => {
  const atual = estado({ textoFinal: "   " });
  const importado = gerarBackup(
    estado({ textoFinal: "Texto do tablet.", tese: "Tese do tablet." })
  ).dados;
  const dados = mesclarDados(atual, importado, "mesclar");
  assert.equal(dados.rascunho.textoFinal, "Texto do tablet.");
  assert.equal(dados.rascunho.tese, "Tese do tablet.");
});

test("substituir troca tudo, inclusive o rascunho atual", () => {
  const atual = estado({
    historico: [versao("local", "Texto somente deste aparelho.", 9000)],
    favoritos: ["tema:local"],
    textoFinal: "Rascunho atual",
  });
  const importado = gerarBackup(
    estado({ historico: [], favoritos: [], textoFinal: "Do arquivo" })
  ).dados;
  const dados = mesclarDados(atual, importado, "substituir");
  assert.equal(dados.historico.length, 0);
  assert.deepEqual(dados.favoritos, []);
  assert.equal(dados.rascunho.textoFinal, "Do arquivo");
});

test("nome do arquivo e resumo são apresentáveis ao usuário", () => {
  assert.match(nomeArquivoBackup(Date.UTC(2026, 9, 27)), /^redacao-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const resumo = resumoBackup(gerarBackup(estado(), Date.now()));
  assert.equal(resumo.versoes, 1);
  assert.equal(resumo.favoritos, 2);
  assert.equal(resumo.temRascunho, true);
  assert.ok(resumo.data.length > 5);
});
