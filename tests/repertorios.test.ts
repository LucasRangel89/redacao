/**
 * Testes do item P0.2 (banco de repertórios verificados).
 * Rode com: npm test
 *
 * São testes de lógica pura: não exigem servidor, banco ou chave de IA.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAMINHO_DADOS, validarRepertorios } from "../scripts/validar-repertorios.mjs";
import {
  buscarRepertoriosVerificados,
  repertorioVerificadoComoSugestao,
  repertoriosVerificados,
  verificadoComoCitacao,
} from "@/data/repertorios-verificados";
import { repertorioLocal } from "@/lib/local-ai";

const dados = JSON.parse(readFileSync(resolve(CAMINHO_DADOS), "utf8"));

test("dataset passa em todas as regras de integridade", () => {
  const { erros, validos } = validarRepertorios(dados);
  assert.deepEqual(erros, [], `erros encontrados: ${erros.join(" | ")}`);
  assert.equal(validos, dados.length);
  assert.ok(dados.length >= 15, "curadoria inicial deve ter pelo menos 15 itens");
});

test("todo repertório verificado tem autor, fonte, URL e orientação de uso", () => {
  for (const r of repertoriosVerificados) {
    assert.ok(r.autor.trim().length > 2, `${r.id}: autor ausente`);
    assert.ok(r.fonte.trim().length > 5, `${r.id}: fonte ausente`);
    assert.ok(r.url.startsWith("https://"), `${r.id}: URL insegura`);
    assert.ok(r.comoUsar.trim().length >= 30, `${r.id}: comoUsar curto`);
  }
});

test("ids são únicos e tipos são reconhecidos pela Biblioteca", () => {
  const ids = repertoriosVerificados.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  const tiposValidos = new Set([
    "filosofico",
    "sociologico",
    "dados",
    "historico",
    "legal",
    "cultural",
  ]);
  for (const r of repertoriosVerificados) {
    assert.ok(tiposValidos.has(r.tipo), `${r.id}: tipo ${r.tipo} inválido`);
  }
});

test("paráfrases nunca são apresentadas como citação literal", () => {
  const parafrases = repertoriosVerificados.filter((r) => r.natureza === "paráfrase");
  assert.ok(parafrases.length >= 5);
  for (const r of parafrases) {
    const rotulo = `${r.fonte} ${r.comoUsar} ${r.observacao ?? ""}`.toLowerCase();
    assert.ok(rotulo.includes("paráfrase"), `${r.id}: paráfrase sem rótulo`);
  }
  const literais = repertoriosVerificados.filter((r) => r.natureza === "citacao");
  for (const r of literais) {
    assert.equal(r.nivelFonte, "primaria", `${r.id}: citação literal exige fonte primária`);
  }
});

test("busca respeita filtros e encontra termos em português com acento", () => {
  const todos = buscarRepertoriosVerificados("");
  assert.equal(todos.length, repertoriosVerificados.length);

  const legais = buscarRepertoriosVerificados("constituição", "legal");
  assert.ok(legais.length >= 2);
  assert.ok(legais.every((r) => r.tipo === "legal"));

  const educacao = buscarRepertoriosVerificados("", "dados", "Educação");
  assert.ok(educacao.length >= 2);
  assert.ok(educacao.every((r) => r.tipo === "dados" && r.area === "Educação"));

  const privacidade = buscarRepertoriosVerificados("privacidade");
  assert.ok(privacidade.length >= 2, "deve encontrar repertórios de privacidade");
  assert.equal(buscarRepertoriosVerificados("zzzzzztermoinexistente").length, 0);
});

test("conversão para citação mantém rastreabilidade da fonte", () => {
  const original = repertoriosVerificados[0]!;
  const citacao = verificadoComoCitacao(original);
  assert.equal(citacao.id, `verif:${original.id}`);
  assert.equal(citacao.texto, original.texto);
  assert.equal(citacao.tipo, original.tipo);
  assert.ok(citacao.fonte.includes(original.url));
});

test("sugestão de repertório explicita natureza e fonte ao estudante", () => {
  const primario = repertoriosVerificados.find((r) => r.nivelFonte === "primaria")!;
  const sugestao = repertorioVerificadoComoSugestao(primario);
  assert.ok(sugestao.fonte.includes("fonte oficial"));
  assert.ok(sugestao.comoUsar.includes(primario.url));
  assert.ok(sugestao.ideiaCentral === primario.texto);
});

test("validador rejeita dados incompletos e URLs não institucionais", () => {
  const base = { ...dados[0] };
  const casos = [
    { ...base, autor: "" },
    { ...base, fonte: "   " },
    { ...base, url: "http://blog-exemplo.com/citacao" },
    { ...base, url: "https://rede-social-qualquer.com/post" },
    { ...base, natureza: "paráfrase", fonte: "Obra clássica", comoUsar: "Use com cuidado no texto.", observacao: "" },
    { ...base, natureza: "citacao", nivelFonte: "secundaria" },
    { ...base, verificadoEm: "2099-01-01" },
    { ...base, ano: 1200 },
  ];
  for (const [i, item] of casos.entries()) {
    const { erros } = validarRepertorios([item]);
    assert.ok(erros.length > 0, `caso ${i + 1} deveria ser rejeitado`);
  }
  const { erros: erroDuplicado } = validarRepertorios([base, base]);
  assert.ok(erroDuplicado.some((e) => e.includes("duplicado")));
});

test("gerador de repertório local prioriza fontes verificadas", () => {
  const sugestoes = repertorioLocal("privacidade digital e proteção de dados", "legal");
  assert.ok(sugestoes.length > 0);
  const verificadas = sugestoes.filter((s) => s.fonte.includes("fonte oficial"));
  assert.ok(
    verificadas.length >= 2,
    `esperava ao menos 2 repertórios verificados; recebi ${verificadas.length}`
  );
  assert.ok(
    sugestoes.findIndex((s) => s.fonte.includes("fonte oficial")) <
      sugestoes.findIndex((s) => s.comoUsar.includes("Confira a atribuição")),
    "verificados devem vir antes das citações não conferidas do acervo"
  );
});
