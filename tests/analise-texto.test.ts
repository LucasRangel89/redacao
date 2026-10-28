/**
 * Testes do item P1.2 (diagnóstico local mais profundo).
 * Rode com: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITE_OCORRENCIAS,
  ORDEM_CATEGORIAS,
  REGRAS,
  ROTULO_CATEGORIA,
  analisarTexto,
  aplicarRegras,
  detectarRepeticoes,
  listarRegras,
} from "@/lib/analise-texto";
import { chatLocal, revisaoLocal } from "@/lib/local-ai";
import type { CategoriaRegra } from "@/lib/types";

/** Redação formal, sem nenhum dos padrões monitorados (controle de falsos positivos). */
const TEXTO_FORMAL = [
  "A educação brasileira enfrenta obstáculos estruturais que comprometem a formação de milhões de jovens. Embora a Constituição de 1988 assegure o ensino fundamental como direito de todos, a realidade das escolas públicas ainda revela carências antigas.",
  "Segundo o IBGE, a taxa de abandono escolar cresceu entre adolescentes de baixa renda. Isso demonstra que a desigualdade de acesso permanece como entrave central, sobretudo nas regiões Norte e Nordeste.",
  "Nesse sentido, o Ministério da Educação deve ampliar programas de formação continuada de professores, por meio de repasses federais e acompanhamento de indicadores, a fim de garantir permanência e aprendizagem. Tal medida já foi adotada em países com bons resultados.",
  "Portanto, a superação desse quadro exige coordenação entre União, estados e municípios. Somente com investimento planejado, avaliação transparente e participação das famílias será possível cumprir o direito à educação de qualidade previsto na lei.",
].join("\n");

const TEXTO_COM_ERROS = [
  "Nós vai precisar de mais tempo. Os alunos vai chegar atrasados.",
  "Devido a falta de investimento, as pessoa precisa de apoio, afim de estudar.",
  "Isso implica em mudanças. A proposta consiste de três etapas.",
  "O tema é relevante mas poucos discutem , e o governo agiu , pra ajudar.",
  "Vc sabe pq isso acontece? A situação tá difícil, né?",
  "A educação é importante. A educação transforma vidas. A educação reduz desigualdades.",
  "Segundo o IBGE, trinta por cento dos jovens não concluem o ensino médio.",
].join("\n");

test("catálogo tem pelo menos 12 regras documentadas e IDs únicos", () => {
  assert.ok(REGRAS.length >= 12, `esperadas >= 12 regras, vieram ${REGRAS.length}`);
  const ids = REGRAS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, "IDs de regras repetidos");
  for (const r of REGRAS) {
    assert.ok(r.nome.length > 3, `${r.id}: nome vazio`);
    assert.ok(r.exemploErro.length > 8, `${r.id}: sem exemplo de erro`);
    assert.ok(r.exemploCorrecao.length > 8, `${r.id}: sem exemplo corrigido`);
    assert.ok(r.explicacao.length > 15, `${r.id}: sem explicação`);
    assert.ok(ORDEM_CATEGORIAS.includes(r.categoria), `${r.id}: categoria inválida`);
    assert.ok(ROTULO_CATEGORIA[r.categoria], `${r.id}: categoria sem rótulo`);
    assert.notEqual(r.exemploErro, r.exemploCorrecao, `${r.id}: exemplos iguais`);
  }
});

test("cada regra detecta seu erro e NÃO gera falso positivo na correção", () => {
  for (const r of REGRAS) {
    const noErro = r.detectar(r.exemploErro);
    assert.ok(noErro.length > 0, `${r.id} não detectou: ${r.exemploErro}`);
    const naCorrecao = r.detectar(r.exemploCorrecao);
    assert.equal(naCorrecao.length, 0, `${r.id} gerou falso positivo em: ${r.exemploCorrecao}`);
  }
});

test("as 8 categorias do plano estão cobertas por regras", () => {
  const cobertas = new Set(REGRAS.map((r) => r.categoria));
  const esperadas: CategoriaRegra[] = [
    "concordancia", "crase", "regencia", "pontuacao",
    "oralidade", "repeticao", "coesao", "argumentacao",
  ];
  for (const c of esperadas) assert.ok(cobertas.has(c), `categoria sem regra: ${c}`);
});

test("listarRegras devolve catálogo serializável (sem funções/regex)", () => {
  const resumo = listarRegras();
  assert.equal(resumo.length, REGRAS.length);
  const bruto = JSON.stringify(resumo);
  assert.ok(!bruto.includes("detectar"));
  assert.ok(bruto.includes("exemploErro"));
  assert.ok(bruto.includes("exemploCorrecao"));
});

test("texto formal de controle não dispara NENHUMA regra", () => {
  const achados = aplicarRegras(TEXTO_FORMAL);
  assert.deepEqual(
    achados.map((o) => `${o.regraId}: ${o.original}`),
    [],
    `falsos positivos: ${achados.map((o) => o.regraId).join(", ")}`
  );
});

test("frases corretas e parecidas não geram falso positivo", () => {
  const casos = [
    "Os alunos vão chegar cedo e as pessoas são responsáveis.",
    "Devido à educação de qualidade, o país avançou.",
    "Às vezes a escola fecha; à primeira vista parece estranho.",
    "A fim de melhorar, o programa consiste em três etapas.",
    "Isso implica mudanças estruturais no currículo.",
    "Em vez de cortar verbas, o governo ampliou o investimento.",
    "No que se refere à educação, no âmbito do governo há metas claras.",
    "Nós vamos estudar e a sociedade deve cobrar resultados.",
    "O tema é relevante, mas poucos o discutem.",
    "A educação é essencial; esse processo transforma vidas e reduz desigualdades estruturais.",
  ];
  for (const frase of casos) {
    const porRegra = REGRAS.filter((r) => r.detectar(frase).length > 0).map((r) => r.id);
    assert.deepEqual(porRegra, [], `falso positivo em "${frase}": ${porRegra.join(", ")}`);
  }
});

test("texto com erros aciona concordância, crase, regência, pontuação e oralidade", () => {
  const achados = aplicarRegras(TEXTO_COM_ERROS);
  const categorias = new Set(achados.map((o) => o.categoria));
  for (const c of [
    "concordancia", "crase", "regencia", "pontuacao",
    "oralidade", "repeticao", "argumentacao",
  ] as CategoriaRegra[]) {
    assert.ok(categorias.has(c), `categoria não detectada: ${c}`);
  }
  for (const o of achados) {
    assert.ok(o.original.trim().length >= 2, "sugestão sem trecho citado");
    assert.ok(o.correcao.length > 1, "sugestão sem correção");
    assert.ok(o.explicacao.length > 10, "sugestão sem explicação");
    assert.ok(o.regra.length > 3, "sugestão sem nome da regra");
  }
});

test("aplicarRegras limita, deduplica e prioriza categorias", () => {
  const repetido = REGRAS.map((r) => r.exemploErro).join("\n");
  const achados = aplicarRegras(repetido);
  assert.ok(achados.length > 0);
  assert.ok(achados.length <= LIMITE_OCORRENCIAS);
  const chaves = achados.map((o) => `${o.regraId}|${o.original}`);
  assert.equal(new Set(chaves).size, chaves.length, "ocorrências duplicadas");
  const prioridade = (c: CategoriaRegra) => ORDEM_CATEGORIAS.indexOf(c);
  for (let i = 1; i < achados.length; i++) {
    assert.ok(prioridade(achados[i - 1]!.categoria) <= prioridade(achados[i]!.categoria));
  }
});

test("chamadas repetidas não acumulam estado de regex (lastIndex)", () => {
  const a = aplicarRegras(TEXTO_COM_ERROS).map((o) => o.regraId).join(",");
  const b = aplicarRegras(TEXTO_COM_ERROS).map((o) => o.regraId).join(",");
  const c = aplicarRegras(TEXTO_FORMAL).map((o) => o.regraId).join(",");
  assert.equal(a, b);
  assert.equal(c, "");
});

test("repetição: 3x em 30 palavras é detectada; 2x ou 3x espalhadas não", () => {
  assert.equal(detectarRepeticoes("A educação é importante. A educação transforma vidas. A educação reduz desigualdades.").length, 1);
  assert.equal(detectarRepeticoes("A educação é importante. A educação transforma vidas.").length, 0);
  // Palavras de preenchimento DISTINTAS: só "educação" se repete, mas 3x espalhadas.
  const filler = (prefixo: string) =>
    Array.from({ length: 35 }, (_, i) => `${prefixo}${i}`).join(" ");
  const espalhado = `educação ${filler("palavra")} educação ${filler("termo")} educação`;
  assert.equal(detectarRepeticoes(espalhado).length, 0);
  // Stopwords não contam como repetição de conteúdo.
  assert.equal(detectarRepeticoes("que que que que que que").length, 0);
});

test("conectivo repetido 3x gera sugestão com alternativas concretas", () => {
  const regra = REGRAS.find((r) => r.id === "Q02")!;
  const achado = regra.detectar("Ademais, a escola falha. Ademais, a família falha. Ademais, o Estado falha.");
  assert.equal(achado.length, 1);
  assert.match(achado[0]!.correcao, /Além disso|Somado a isso/);
  assert.equal(regra.detectar("Além disso, a escola falha. Somado a isso, a família falha. Não obstante, o Estado falha.").length, 0);
});

test("repertório sem análise é sinalizado; com análise, não", () => {
  const regra = REGRAS.find((r) => r.id === "Q03")!;
  assert.equal(regra.detectar("Segundo o IBGE, 30% dos jovens não concluem o ensino médio.").length, 1);
  assert.equal(
    regra.detectar("Segundo o IBGE, 30% dos jovens não concluem o ensino médio. Isso demonstra a urgência de políticas públicas.").length,
    0
  );
});

test("analisarTexto expõe contagem por categoria e correções tipadas", () => {
  const d = analisarTexto(TEXTO_COM_ERROS);
  assert.ok(d.palavras > 20);
  assert.equal(d.paragrafos, 7);
  assert.equal(d.correcoes.length, d.ocorrencias.length);
  assert.ok(d.porCategoria.concordancia > 0);
  assert.equal(d.porCategoria.coesao, 0, "Q02 só aparece com 3 conectivos iguais");
  for (const c of d.correcoes) {
    assert.ok(c.categoria, "correção sem categoria");
    assert.ok(c.regra, "correção sem nome da regra");
  }
  const limpo = analisarTexto(TEXTO_FORMAL);
  assert.equal(limpo.ocorrencias.length, 0);
  assert.ok(limpo.pontosFortes.some((p) => p.includes("padrões monitorados")));
  assert.ok(analisarTexto("").palavras === 0);
});

test("revisaoLocal: modo rápido, gramatical e profundo", () => {
  const rapida = revisaoLocal(TEXTO_COM_ERROS, "rapida");
  assert.equal(rapida.competencias, undefined);
  assert.deepEqual(rapida.correcoes, []);
  assert.match(rapida.resumo, /não uma nota oficial/);

  const gramatical = revisaoLocal(TEXTO_COM_ERROS, "gramatical");
  assert.ok(gramatical.correcoes!.length >= 5);
  assert.ok(gramatical.correcoes!.some((c) => c.categoria === "crase"));
  assert.ok(gramatical.correcoes!.some((c) => c.categoria === "concordancia"));
  assert.match(gramatical.resumo, /26 regras locais verificadas/i);

  // Sem achados: silêncio honesto, sem "correção" inventada.
  const limpa = revisaoLocal(TEXTO_FORMAL, "gramatical");
  assert.deepEqual(limpa.correcoes, []);
  assert.match(limpa.resumo, /Nenhum dos 26 padrões/i);

  const profunda = revisaoLocal(TEXTO_FORMAL, "profunda", "Educação");
  assert.equal(profunda.competencias?.length, 5);
  assert.ok(profunda.notaEstimada! >= 0 && profunda.notaEstimada! <= 1000);
  assert.ok(profunda.proximosPassos!.some((p) => p.includes("Revisão local")));
});

test("chatLocal continua usando o diagnóstico extraído (regressão)", () => {
  const resposta = chatLocal(
    [{ role: "user", content: "Analise meu trecho, por favor" }],
    { trechoTexto: TEXTO_FORMAL.slice(0, 120) }
  );
  assert.match(resposta, /palavras/);
  assert.match(resposta, /Mentor local/);
});
