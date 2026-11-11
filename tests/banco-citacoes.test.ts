import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  bancoCitacoes,
  buscarCitacoesBanco,
  EIXOS_BANCO,
  formatarCitacaoParaRedacao,
  naturezaCitacaoBanco,
  textoLimpoBanco,
  TOTAL_CONFERIR_FONTE_BANCO,
  TOTAL_FONTE_CONFIRMADA_BANCO,
} from "@/lib/banco-citacoes";
import { CAMINHO_DADOS, validarBancoCitacoes } from "../scripts/sync-banco-citacoes.mjs";
import { repertorioLocal } from "@/lib/local-ai";

const dados = JSON.parse(readFileSync(resolve(CAMINHO_DADOS), "utf8"));

test("a cópia sincronizada do Banco contém registros válidos com IDs únicos", () => {
  const { erros, validos } = validarBancoCitacoes(dados);
  assert.deepEqual(erros, []);
  assert.equal(validos, dados.length);
  assert.ok(dados.length >= 255, "o acervo completo do Banco deve estar disponível");
  assert.equal(new Set(dados.map((item: { id: string }) => item.id)).size, dados.length);
});

test("o adaptador preserva os 18 eixos, as categorias e o status editorial do Banco", () => {
  assert.equal(bancoCitacoes.length, dados.length);
  assert.equal(EIXOS_BANCO.length, 18);
  assert.equal(TOTAL_FONTE_CONFIRMADA_BANCO + TOTAL_CONFERIR_FONTE_BANCO, bancoCitacoes.length);
  assert.ok(bancoCitacoes.every((item) => item.id.startsWith("banco:")));
  assert.ok(bancoCitacoes.every((item) => item.tags.length > 0 && item.comoUsar.length > 0));
  assert.ok(bancoCitacoes.some((item) => item.tipo === "cientifico"));
  assert.ok(bancoCitacoes.some((item) => item.tipo === "literario"));
});

test("busca do Banco ignora acentos e procura também em metadados pedagógicos", () => {
  const porAutor = buscarCitacoesBanco({ consulta: "paulo freire" });
  assert.ok(porAutor.length > 0);
  assert.ok(porAutor.every((item) => item.autor === "Paulo Freire"));

  const porConceito = buscarCitacoesBanco({ consulta: "transformacao social" });
  assert.ok(porConceito.some((item) =>
    `${item.conceitoChave} ${item.temaPrincipal}`.toLowerCase().includes("transformação")
  ));

  const porOrientacao = buscarCitacoesBanco({ consulta: "instrumento essencial mudança social" });
  assert.ok(porOrientacao.length > 0);

  assert.equal(buscarCitacoesBanco({ consulta: "termo completamente inexistente" }).length, 0);
});

test("filtros por eixo, tipo, uso e verificação podem ser combinados", () => {
  const educacao = buscarCitacoesBanco({ eixo: "Educação" });
  assert.equal(educacao.length, 15);
  assert.ok(educacao.every((item) => item.eixo === "Educação"));

  const combinadas = buscarCitacoesBanco({
    eixo: "Educação",
    tipo: "#tipo-filosofica",
    uso: "#uso-desenvolvimento",
    verificacao: "#fonte-confirmada",
  });
  assert.ok(combinadas.length > 0);
  assert.ok(combinadas.every((item) =>
    item.eixo === "Educação" &&
    item.tags.includes("#tipo-filosofica") &&
    item.tags.includes("#uso-desenvolvimento") &&
    item.verificacao === "#fonte-confirmada"
  ));
});

test("a adaptação gera referência em texto corrido para uma citação literal", () => {
  const item = bancoCitacoes.find((citacao) => citacao.bancoId === "EDU02")!;
  const frase = formatarCitacaoParaRedacao(item);
  assert.match(frase, /^Segundo Paulo Freire/);
  assert.match(frase, /Pedagogia da Indignação, 2000/);
  assert.match(frase, /“Se a educação sozinha não transforma a sociedade, sem ela tampouco a sociedade muda\.”/);
  assert.doesNotMatch(frase, /\.\.”/);
});

test("normas preservam artigo e ano no modelo de inserção", () => {
  const item = bancoCitacoes.find((citacao) => citacao.bancoId === "EDU07")!;
  const frase = formatarCitacaoParaRedacao(item);
  assert.match(frase, /^Conforme dispõe a Constituição Federal de 1988/);
  assert.match(frase, /Art\. 205, 1988/);
  assert.match(frase, /“A educação, direito de todos/);
});

test("paráfrases são identificadas e nunca entram entre aspas no modelo", () => {
  const item = bancoCitacoes.find((citacao) => citacao.bancoId === "EDU13")!;
  assert.equal(naturezaCitacaoBanco(item), "parafrase");
  assert.ok(textoLimpoBanco(item).includes("a prática da liberdade"));
  const frase = formatarCitacaoParaRedacao(item);
  assert.match(frase, /Segundo a educadora e teórica feminista norte-americana bell hooks/);
  assert.doesNotMatch(frase, /[“”]/);
  assert.match(frase, /\.$/);
});

test("alusões literárias recebem estrutura de obra e não são apresentadas como fala literal", () => {
  const item = bancoCitacoes.find((citacao) => citacao.bancoId === "EDU15")!;
  assert.equal(naturezaCitacaoBanco(item), "alusao");
  const frase = formatarCitacaoParaRedacao(item);
  assert.match(frase, /^Na obra Conto de Escola, 1884, de Machado de Assis/);
  assert.match(frase, /observa-se que a aula autoritária/);
  assert.doesNotMatch(frase, /[“”]/);
  assert.doesNotMatch(frase, /Em Conto de Escola, a aula/);
});

test("o motor local recomenda o tipo científico do Banco sem misturar outros tipos verificados", () => {
  const sugestoes = repertorioLocal("educação científica e acesso ao conhecimento", "cientifico");
  assert.ok(sugestoes.length > 0);
  assert.ok(sugestoes.every((item) => !item.fonte.includes("fonte oficial")));
  assert.ok(sugestoes.some((item) => item.comoUsar.includes("Banco marca") || item.comoUsar.includes("Banco recomenda")));
});

test("validador rejeita IDs duplicados, tipos ausentes e status inconsistentes", () => {
  const base = { ...dados[0], tags: [...dados[0].tags] };
  const duplicada = validarBancoCitacoes([base, base]);
  assert.ok(duplicada.erros.some((erro) => erro.includes("ID duplicado")));

  const semTipo = validarBancoCitacoes([{ ...base, tags: ["#fonte-confirmada"], verificacao: "#fonte-confirmada" }]);
  assert.ok(semTipo.erros.some((erro) => erro.includes("tag de tipo")));

  const statusInconsistente = validarBancoCitacoes([
    { ...base, verificacao: "#verificar-fonte", tags: base.tags.filter((tag: string) => tag !== "#fonte-confirmada") },
  ]);
  assert.ok(statusInconsistente.erros.some((erro) => erro.includes("tag de verificação")));
});
