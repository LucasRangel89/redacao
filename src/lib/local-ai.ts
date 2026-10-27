/**
 * Motor local (sem IA, sem servidor).
 *
 * Garante que TODAS as ferramentas do app continuem úteis quando não há backend
 * disponível — por exemplo em uma publicação estática no GitHub Pages. As respostas
 * são heurísticas e usam o acervo versionado em docs/acervo-redacoes.md.
 *
 * Regras de honestidade:
 *  - Nunca se passa por correção oficial: notas são estimativas didáticas.
 *  - Nunca escreve a redação pelo estudante: entrega peças e perguntas.
 */
import {
  acervo,
  citacoesDoTema,
  normalizar,
  temaMaisProximo,
  termos,
  type Citacao,
} from "@/lib/recursos";
import { CHECKLIST, CONECTIVOS } from "@/data/guia";
import {
  buscarRepertoriosVerificados,
  repertorioVerificadoComoSugestao,
  repertoriosVerificados,
  type RepertorioVerificado,
} from "@/data/repertorios-verificados";
import type {
  ArquiteturaSugestao,
  BuscaResultado,
  ChatMessage,
  IntervencaoSugestao,
  ModoRevisao,
  RepertorioSugestao,
  RevisaoResultado,
  Tema,
} from "@/lib/types";

const AVISO_LOCAL =
  "Modo local (sem IA conectada): sugestões derivadas do acervo do projeto. Reescreva com as suas palavras.";

const TODOS_CONECTIVOS = CONECTIVOS.flatMap((c) => c.itens.map((i) => i.toLowerCase()));

// Fronteiras Unicode: \b falha em palavras acentuadas como "né" e "tá".
const INFORMALIDADES: { regex: RegExp; original: string; correcao: string; explicacao: string }[] = [
  { regex: /(?<![\p{L}\p{N}])pra(?![\p{L}\p{N}])/giu, original: "pra", correcao: "para", explicacao: "Forma reduzida e oral; use a preposição formal." },
  { regex: /(?<![\p{L}\p{N}])tá(?![\p{L}\p{N}])/giu, original: "tá", correcao: "está", explicacao: "Forma oral do verbo estar; use a forma plena." },
  { regex: /(?<![\p{L}\p{N}])né(?![\p{L}\p{N}])/giu, original: "né", correcao: "não é", explicacao: "Marca de oralidade inadequada ao texto dissertativo." },
  { regex: /(?<![\p{L}\p{N}])a gente(?![\p{L}\p{N}])/giu, original: "a gente", correcao: "a população / os cidadãos", explicacao: "Substitua por sujeito formal e específico." },
  { regex: /(?<![\p{L}\p{N}])vc(?![\p{L}\p{N}])/giu, original: "vc", correcao: "você", explicacao: "Abreviação de internet; evite no texto formal." },
  { regex: /(?<![\p{L}\p{N}])tipo(?=\s*,)/giu, original: "tipo", correcao: "como / por exemplo", explicacao: "Marcador de oralidade; prefira um conectivo de exemplificação." },
  { regex: /(?<![\p{L}\p{N}])msm(?![\p{L}\p{N}])/giu, original: "msm", correcao: "mesmo", explicacao: "Abreviação informal." },
  { regex: /(?<![\p{L}\p{N}])pq(?![\p{L}\p{N}])/giu, original: "pq", correcao: "porque", explicacao: "Abreviação informal de conjunção causal." },
  { regex: /(?<![\p{L}\p{N}])em relação a(?![\p{L}\p{N}])/giu, original: "em relação a", correcao: "no que se refere a", explicacao: "Locução preferível na modalidade escrita formal." },
  { regex: /(?<![\p{L}\p{N}])a nível de(?![\p{L}\p{N}])/giu, original: "a nível de", correcao: "no âmbito de", explicacao: "Expressão criticada pela norma culta; prefira 'no âmbito de'." },
];

// ---------------------------------------------------------------------------
// Temas
// ---------------------------------------------------------------------------

export function gerarTemasLocal(area = "Geral"): Tema[] {
  const candidatos =
    area && area !== "Geral"
      ? acervo.temas.filter((t) => t.area === area)
      : acervo.temas;
  const base = candidatos.length > 0 ? candidatos : acervo.temas;
  return base.slice(0, 6).map((t) => ({
    titulo: t.enunciado,
    area: t.area,
    textosMotivadores: t.textosMotivadores,
  }));
}

// ---------------------------------------------------------------------------
// Arquitetura
// ---------------------------------------------------------------------------

function citacoesRelevantes(tema: string, quantidade = 2): Citacao[] {
  const proximo = temaMaisProximo(tema);
  const doTema = proximo ? citacoesDoTema(proximo.id) : [];
  const palavras = termos(tema);
  const ordenadas = [...acervo.citacoes].sort((a, b) => {
    const score = (c: Citacao) => {
      const texto = normalizar(`${c.texto} ${c.autor}`);
      return palavras.reduce((acc, p) => acc + (texto.includes(p) ? 1 : 0), 0);
    };
    return score(b) - score(a);
  });
  const misturadas = [...doTema, ...ordenadas.filter((c) => !doTema.includes(c))];
  return Array.from(new Map(misturadas.map((c) => [c.id, c])).values()).slice(0, quantidade);
}

function assunto(tema: string): string {
  // Enunciados ENEM terminam com ": apresente proposta de intervenção…".
  // O tema é o trecho ANTES dos dois-pontos, não a instrução.
  const bruto = (tema.split(/[:–—]/)[0] ?? "").trim();
  const limpo = bruto
    .replace(/["“”]/g, "")
    .replace(/[.!?]+$/, "")
    .trim();
  const curto = limpo.split(/\s+/).slice(0, 12).join(" ");
  return curto || "o problema discutido";
}

export function arquiteturaLocal(tema: string, teseAtual = ""): ArquiteturaSugestao {
  const alvo = assunto(tema);
  const [c1, c2] = citacoesRelevantes(tema, 2);
  const tese =
    teseAtual.trim() ||
    `O tema “${alvo}” exige a combinação entre regulação efetiva e educação da população, pois o problema decorre tanto de falhas institucionais quanto da falta de informação.`;

  return {
    tese,
    argumentos: [
      {
        topicoFrasal: `A ausência de mecanismos de controle e transparência agrava o quadro de “${alvo}”.`,
        repertorio: c1
          ? `${c1.texto} — ${c1.autor}.`
          : `A legislação brasileira (LGPD e Constituição Federal) reconhece a proteção de dados como direito fundamental.`,
        analise: `Esse repertório revela que a fragilidade normativa não é apenas técnica: ela produz desconfiança e amplia a vulnerabilidade dos cidadãos. Logo, fiscalizar e tornar públicas as regras é condição para que a tese se concretize.`,
      },
      {
        topicoFrasal: `A desigualdade de acesso à informação perpetua os efeitos de “${alvo}”.`,
        repertorio: c2
          ? `${c2.texto} — ${c2.autor}.`
          : `Estudos sobre inclusão digital mostram que o acesso desigual a tecnologias aprofunda disparidades sociais.`,
        analise: `Ao relacionar o repertório ao tema, percebe-se que políticas universais não atingem quem mais precisa. Por isso, a ação pública deve priorizar os grupos mais expostos, com metas e acompanhamento.`,
      },
    ],
    aviso: AVISO_LOCAL,
  };
}

// ---------------------------------------------------------------------------
// Repertório
// ---------------------------------------------------------------------------

export function repertorioLocal(tema: string, tipo: string): RepertorioSugestao[] {
  const proximo = temaMaisProximo(tema);
  const palavras = termos(tema);

  const pontuarCitacao = (c: Citacao) => {
    const texto = normalizar(`${c.texto} ${c.autor} ${c.fonte}`);
    return (
      palavras.reduce((acc, p) => acc + (texto.includes(p) ? 2 : 0), 0) +
      (c.tipo === tipo ? 4 : 0) +
      (proximo && c.temaId === proximo.id ? 3 : 0)
    );
  };

  // P0.2: repertórios verificados entram primeiro. São fontes rastreáveis e
  // reduzem o risco de o estudante usar uma atribuição inventada do acervo.
  const pontuarVerificado = (r: RepertorioVerificado) => {
    const texto = normalizar(`${r.texto} ${r.autor} ${r.fonte} ${r.area} ${r.comoUsar}`);
    return (
      palavras.reduce((acc, p) => acc + (texto.includes(p) ? 2 : 0), 0) +
      (r.tipo === tipo ? 4 : 0) +
      (proximo && r.area === proximo.area ? 2 : 0) +
      (r.nivelFonte === "primaria" ? 2 : 0)
    );
  };

  const verificados = [...repertoriosVerificados]
    .sort((a, b) => pontuarVerificado(b) - pontuarVerificado(a))
    .slice(0, 3)
    .map(repertorioVerificadoComoSugestao);

  const ordenadas = [...acervo.citacoes].sort((a, b) => pontuarCitacao(b) - pontuarCitacao(a));
  const doTipo = ordenadas.filter((c) => c.tipo === tipo).slice(0, 3);
  const complemento = ordenadas.filter((c) => !doTipo.includes(c));
  const doAcervo = [...doTipo, ...complemento]
    .slice(0, Math.max(0, 5 - verificados.length))
    .map((c) => ({
      titulo: `“${c.texto.slice(0, 90)}${c.texto.length > 90 ? "…" : ""}”`,
      fonte: c.autor,
      ideiaCentral: c.texto,
      comoUsar: `Cite ${c.autor} no início do parágrafo e, em seguida, explique como a ideia comprova seu tópico frasal: “Isso demonstra que…”. Confira a atribuição antes de usar.`,
    }));

  return [...verificados, ...doAcervo];
}

// ---------------------------------------------------------------------------
// Proposta de intervenção
// ---------------------------------------------------------------------------

const AGENTES: [RegExp, string][] = [
  [/educa|escola|professor|pandemia/i, "O Ministério da Educação, em parceria com as secretarias estaduais"],
  [/dados|privacidade|tecnolog|digital|sigilo/i, "A Autoridade Nacional de Proteção de Dados, junto ao Congresso Nacional"],
  [/saúde|saude|médic/i, "O Ministério da Saúde, em articulação com estados e municípios"],
  [/trabalh|emprego|funcionário|laboral/i, "O Ministério do Trabalho, em parceria com empresas e sindicatos"],
  [/ambient|sustent|clima|ods/i, "O Ministério do Meio Ambiente, com apoio de prefeituras e da sociedade civil"],
  [/financeir|desmonetiza|banco/i, "O Banco Central do Brasil, em conjunto com instituições financeiras"],
];

export function intervencaoLocal(tema: string, problema = ""): IntervencaoSugestao {
  const texto = `${tema} ${problema}`;
  const agente = AGENTES.find(([re]) => re.test(texto))?.[1] ?? "O Poder Público Federal, em parceria com a sociedade civil";
  const alvo = assunto(tema);
  const acao = `deve implementar um programa nacional voltado ao tema “${alvo}”`;
  const meio = "por meio de campanhas educativas, formação de profissionais e canais gratuitos de atendimento";
  const finalidade = "a fim de reduzir as desigualdades associadas ao problema e garantir o acesso universal a direitos básicos";
  const detalhamento =
    "com metas trimestrais, indicadores públicos de resultado e auditoria independente, o que permitirá corrigir falhas de execução";
  return {
    agente,
    acao,
    meio,
    finalidade,
    detalhamento,
    esqueletoParagrafo: `${agente} ${acao}, ${meio}, ${finalidade}, ${detalhamento}. Trata-se de um esqueleto: reescreva com as suas palavras e adapte ao seu argumento.`,
  };
}

// ---------------------------------------------------------------------------
// Mentor socrático
// ---------------------------------------------------------------------------

interface ContextoMentor {
  tema?: string;
  tese?: string;
  arquitetura?: string;
  trechoTexto?: string;
}

export function chatLocal(mensagens: ChatMessage[], contexto: ContextoMentor = {}): string {
  const ultima = [...mensagens].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = normalizar(ultima);
  const tema = contexto.tema ? `sobre **${contexto.tema.slice(0, 110)}**` : "do seu texto";
  const intro = "_Mentor local (sem IA conectada): vou te guiar com perguntas, sem escrever por você._";

  let corpo: string;
  if (/introducao/.test(q)) {
    corpo = `Para a introdução ${tema}, responda em voz alta:\n\n1. Qual repertório (lei, dado, autor ou fato) abre a discussão com força?\n2. Em que frase você transforma esse repertório em **tese**?\n3. Quais são as duas causas que seus parágrafos vão desenvolver?\n\nEscreva a tese em **uma frase só**. Se ela couber em uma linha e responder ao enunciado, você tem introdução.`;
  } else if (/repertorio|cita(c|ç)(a|o)|autor/.test(q)) {
    corpo = `Repertório produtivo não é decoração. Para cada citação que você usar ${tema}, complete a frase:\n\n> "Isso comprova meu argumento porque…"\n\nSe você não conseguir completar, a citação está colada. Na **Biblioteca → Citações** há ${acervo.totalCitacoes} repertórios do acervo com filtro por tipo — escolha 2 e escreva a análise de cada um.`;
  } else if (/nota|1000|mil|competencia/.test(q)) {
    corpo = `Nota 1000 exige as 5 competências no mesmo texto. Diagnóstico rápido ${tema}:\n\n- **C1** — releu concordância, crase e oralidade?\n- **C2** — usou 2 repertórios e analisou ambos?\n- **C3** — tese explícita + 2 argumentos encadeados?\n- **C4** — pelo menos 5 conectivos diferentes?\n- **C5** — os 5 elementos da intervenção?\n\nAbra o **Guia ENEM → Checklist** e marque o que já está garantido. Qual competência está mais fraca agora? Trabalhe nela primeiro.`;
  } else if (/argumento|paragrafo|desenvolvimento/.test(q)) {
    corpo = `Teste seu desenvolvimento ${tema} com o esqueleto de 4 movimentos:\n\n1. **Tópico frasal** — uma afirmação, não uma pergunta.\n2. **Repertório** — dado, lei, autor ou fato histórico.\n3. **Análise** — relacione o repertório ao tópico frasal com um "portanto".\n4. **Fecho** — retome a tese.\n\nQual desses quatro movimentos falta no seu parágrafo agora?`;
  } else if (/intervencao|proposta|conclusao/.test(q)) {
    corpo = `Sua conclusão ${tema} precisa de 5 elementos: **agente, ação, meio, finalidade e detalhamento**. Pergunte-se:\n\n- Quem tem poder real de executar? (evite "a sociedade" sozinha)\n- Como a ação será viabilizada?\n- Qual mecanismo comprova que funcionou?\n\nEscreva a proposta em uma frase e circule os 5 elementos.`;
  } else if (/coesao|conectivo|repeti|virgula/.test(q)) {
    corpo = `Para variar a coesão ${tema}, troque "e / mas / então" por conectivos de relação precisa:\n\n- Causa: **porquanto, visto que, uma vez que**\n- Oposição: **no entanto, embora, em contrapartida**\n- Conclusão: **portanto, dessarte, diante do exposto**\n\nPegue um parágrafo seu e tente usar 3 conectivos diferentes. Qual relação lógica você quer marcar primeiro?`;
  } else if (contexto.trechoTexto && contexto.trechoTexto.trim().length > 40) {
    const stats = analisarTexto(contexto.trechoTexto);
    corpo = `Li o trecho ${tema}: ~${stats.palavras} palavras, ${stats.paragrafos} blocos e ${stats.conectivosDistintos} conectivos distintos.\n\n${stats.pontosFracos[0] ?? "O próximo passo é revisar o encadeamento entre os parágrafos."}\n\nO que você quer melhorar primeiro: **estrutura**, **repertório** ou **coesão**?`;
  } else {
    corpo = `Vamos começar pelo essencial ${tema}. Responda em uma frase: **qual é a sua tese?**\n\nDepois me diga quais dois argumentos a sustentam. Eu não vou escrever o texto por você — vou fazer as perguntas que um corretor faria.\n\nSe ainda não escolheu tema, explore a **Biblioteca** (${acervo.totalTemas} dossiês, ${acervo.totalRedacoes} redações modelo e ${acervo.totalCitacoes} citações).`;
  }
  return `${intro}\n\n${corpo}`;
}

// ---------------------------------------------------------------------------
// Busca local
// ---------------------------------------------------------------------------

export function buscaLocal(query: string): BuscaResultado {
  const verificados = buscarRepertoriosVerificados(query).slice(0, 4);
  const { temas, citacoes } = (() => {
    const nq = normalizar(query);
    return {
      temas: acervo.temas.filter(
        (t) =>
          normalizar(`${t.titulo} ${t.enunciado} ${t.area} ${t.resumo}`).includes(nq) ||
          termos(query).some((p) => normalizar(t.titulo).includes(p))
      ),
      citacoes: acervo.citacoes.filter(
        (c) =>
          normalizar(`${c.texto} ${c.autor}`).includes(nq) ||
          termos(query).some((p) => normalizar(c.texto).includes(p))
      ),
    };
  })();

  const fonteLocal = (titulo: string, subtitulo: string) => ({
    title: titulo,
    snippet: subtitulo,
    url: `local://biblioteca?q=${encodeURIComponent(query)}`,
  });

  return {
    sintese:
      temas.length || citacoes.length || verificados.length
        ? `Busca local no acervo do projeto (sem acesso à web): ${verificados.length} repertório(s) verificado(s), ${temas.length} dossiê(s) temático(s) e ${citacoes.length} citação(ões) relacionadas a “${query}”. Abra a Biblioteca para ler os textos completos.`
        : `Não encontrei correspondência direta para “${query}” no acervo local. Tente termos mais amplos (ex.: "educação", "tecnologia") ou conecte uma chave de IA para busca fundamentada na web.`,
    dados: [
      ...verificados.map((r) => ({
        dado: `“${r.texto}” — ${r.autor}`,
        fonte: `Fonte verificada · ${r.fonte}`,
      })),
      ...citacoes.slice(0, 6).map((c) => ({ dado: `“${c.texto}” — ${c.autor}`, fonte: `Acervo local · ${c.tipo}` })),
    ].slice(0, 8),
    resultados: [
      ...verificados.map((r) => ({
        title: `✓ ${r.autor}`,
        snippet: `Fonte verificada · ${r.natureza} · ${r.texto.slice(0, 150)}`,
        url: r.url,
      })),
      ...temas.slice(0, 4).map((t) =>
        fonteLocal(`Dossiê: ${t.titulo}`, `${t.redacoes.length} redações modelo · ${t.citacoes.length} citações · ${t.resumo.slice(0, 130)}`)
      ),
      ...citacoes.slice(0, 4).map((c) => fonteLocal(`${c.autor}`, `Citação do acervo · ${c.texto.slice(0, 140)}`)),
    ],
  };
}

// ---------------------------------------------------------------------------
// Diagnóstico local de redação
// ---------------------------------------------------------------------------

interface Diagnostico {
  palavras: number;
  paragrafos: number;
  linhas: number;
  conectivosDistintos: number;
  totalConectivos: number;
  temCitacao: boolean;
  temAnalise: boolean;
  formalidade: number;
  repeticaoQue: number;
  pontuacao: number;
  elementos: Record<"agente" | "acao" | "meio" | "finalidade" | "detalhamento", boolean>;
  correcoes: { original: string; correcao: string; explicacao: string }[];
  pontosFracos: string[];
  pontosFortes: string[];
}

function analisarTexto(texto: string): Diagnostico {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  const blocos = texto.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const lower = texto.toLowerCase();
  const conectivosEncontrados = TODOS_CONECTIVOS.filter((c) => lower.includes(c));
  const totalConectivos = TODOS_CONECTIVOS.reduce(
    (acc, c) => acc + (lower.split(c).length - 1),
    0
  );

  const correcoes: Diagnostico["correcoes"] = [];
  for (const regra of INFORMALIDADES) {
    const encontrados = texto.match(regra.regex);
    if (encontrados?.length) {
      correcoes.push({
        original: `${encontrados[0]} (${encontrados.length}x)`,
        correcao: regra.correcao,
        explicacao: regra.explicacao,
      });
    }
  }

  const temCitacao = /segundo|conforme|de acordo com|como afirma|como aponta|“|"|lei n|artigo|constitui|pesquisa|estudo/i.test(
    texto
  );
  const temAnalise = /isso (demonstra|comprova|evidencia|revela)|portanto|logo|dessa forma|por isso|assim,|tal (contexto|fato|cenario)/i.test(
    texto
  );
  const pontuacao = (texto.match(/[.,;:!?—]/g) ?? []).length;
  const repeticaoQue = (lower.match(/\bque\b/g) ?? []).length;
  const formalidade = Math.max(0, 100 - correcoes.length * 20);

  const elementos = {
    agente: /governo|ministério|ministerio|poder público|poder publico|união|uniao|estado|prefeitura|congresso|escolas|empresas|onu|agência|agencia|autoridade|banco central|secretaria/i.test(texto),
    acao: /deve|devem|precisa|é necessário|e necessario|implementar|ampliar|criar|promover|investir|fiscalizar|garantir|regulamentar|oferecer|estimular/i.test(texto),
    meio: /por meio de|através de|atras|via |com a criação|com a implementa|mediante|por intermédio|utilizando|com campanhas|com cursos/i.test(texto),
    finalidade: /para que|a fim de|com o objetivo|com a finalidade|para garantir|para reduzir|visando|com vistas a/i.test(texto),
    detalhamento: /o que permitirá|o que possibilitará|garantindo que|de modo que|por exemplo|como forma de|com acompanhamento|monitoramento|indicadores|metas|auditoria/i.test(texto),
  };

  const pontosFortes: string[] = [];
  const pontosFracos: string[] = [];
  if (blocos.length >= 4) pontosFortes.push(`Estrutura com ${blocos.length} blocos de parágrafo — introdução, desenvolvimento e conclusão aparentes.`);
  else pontosFracos.push(`O texto tem ${blocos.length} bloco(s). Organize em 4 ou 5 parágrafos.`);
  if (palavras >= 350 && palavras <= 650) pontosFortes.push(`${palavras} palavras: extensão adequada à folha oficial (≈30 linhas).`);
  else if (palavras < 350) pontosFracos.push(`Apenas ${palavras} palavras. Desenvolva mais os argumentos para chegar a ≈350–550 palavras.`);
  else pontosFracos.push(`${palavras} palavras podem ultrapassar 30 linhas. Revise o limite da folha oficial.`);
  if (conectivosEncontrados.length >= 5) pontosFortes.push(`${conectivosEncontrados.length} conectivos distintos: boa variedade de relações lógicas.`);
  else pontosFracos.push(`Só ${conectivosEncontrados.length} conectivo(s) distinto(s). Varie com causalidade, oposição e conclusão.`);
  if (temCitacao) pontosFortes.push("Há indícios de repertório produtivo (citação, dado ou lei).");
  else pontosFracos.push("Não encontrei repertório explícito. Insira ao menos duas referências verificáveis.");
  if (temAnalise) pontosFortes.push("O texto apresenta marcadores de análise e encadeamento argumentativo.");
  else pontosFracos.push("Faltam marcadores de análise (ex.: 'isso demonstra que…') após os repertórios.");
  if (correcoes.length === 0) pontosFortes.push("Nenhuma marca evidente de oralidade encontrada na varredura local.");
  else pontosFracos.push(`${correcoes.length} padrão(ões) de informalidade detectado(s) — veja as correções sugeridas.`);
  if (repeticaoQue > palavras / 25) pontosFracos.push(`"que" aparece ${repeticaoQue}x. Substitua parte das ocorrências por conectivos precisos.`);
  if (Object.values(elementos).every(Boolean)) pontosFortes.push("Proposta de intervenção com indícios dos 5 elementos obrigatórios.");
  else pontosFracos.push(`Intervenção incompleta: falta(m) ${Object.entries(elementos).filter(([, v]) => !v).map(([k]) => k).join(", ")}.`);

  return {
    palavras,
    paragrafos: blocos.length,
    linhas: blocos.reduce((acc, b) => acc + Math.max(1, Math.ceil(b.length / 70)), 0),
    conectivosDistintos: conectivosEncontrados.length,
    totalConectivos,
    temCitacao,
    temAnalise,
    formalidade,
    repeticaoQue,
    pontuacao,
    elementos,
    correcoes: correcoes.slice(0, 10),
    pontosFracos,
    pontosFortes,
  };
}

function arredondarNota(valor: number): number {
  return Math.max(0, Math.min(200, Math.round(valor / 40) * 40));
}

function feedbackCompetencia(codigo: string, d: Diagnostico): string {
  switch (codigo) {
    case "C1":
      return `Varredura local: ${d.correcoes.length} padrão(ões) de informalidade, ${d.pontuacao} sinais de pontuação e ${d.repeticaoQue} ocorrências de "que". ${d.correcoes.length ? "Substitua os registros orais e revise a pontuação." : "Sem desvios evidentes na amostra — confirme com uma leitura em voz alta."}`;
    case "C2":
      return `${d.temCitacao ? "Foram encontrados indícios de repertório." : "Não encontrei repertório explícito."} ${d.temAnalise ? "Há marcadores de análise do repertório." : "Inclua uma frase de análise depois de cada citação."} Verifique também se os termos do enunciado reaparecem no texto.`;
    case "C3":
      return `${d.paragrafos} parágrafo(s), ${d.palavras} palavras e ${d.totalConectivos} conectivos no total. ${d.paragrafos >= 4 ? "A estrutura está organizada; confirme se cada parágrafo tem tópico frasal e se a tese é retomada." : "Organize em 4 blocos com tese explícita e dois argumentos encadeados."}`;
    case "C4":
      return `${d.conectivosDistintos} conectivos distintos detectados (${d.totalConectivos} ocorrências). ${d.conectivosDistintos >= 5 ? "Boa variedade; confira se cada conectivo expressa a relação correta." : "Amplie o repertório de conectivos de causa, oposição e conclusão."}`;
    case "C5":
      return `Elementos detectados: ${Object.entries(d.elementos).map(([k, v]) => `${v ? "✓" : "✗"} ${k}`).join(" · ")}. ${Object.values(d.elementos).every(Boolean) ? "Confira se a proposta respeita os direitos humanos." : "Complete os elementos faltantes na conclusão."}`;
    default:
      return "";
  }
}

export function revisaoLocal(texto: string, modo: ModoRevisao, tema = ""): RevisaoResultado {
  const d = analisarTexto(texto);
  const prefixo = "Diagnóstico local (sem IA): análise heurística, não uma nota oficial.";
  const curto = d.palavras < 250;
  const resumo = `${prefixo} ${d.palavras} palavras · ${d.paragrafos} parágrafos · ~${d.linhas} linhas · ${d.conectivosDistintos} conectivos distintos.${
    tema ? ` Tema considerado: ${tema.slice(0, 100)}.` : ""
  }${curto ? " Texto abaixo da extensão recomendada: as notas foram ajustadas para baixo." : ""}`;

  const notas: Record<string, number> = {
    C1: arredondarNota(d.formalidade * 1.2 + (d.repeticaoQue < d.palavras / 30 ? 60 : 0)),
    C2: arredondarNota((d.temCitacao ? 120 : 40) + (d.temAnalise ? 80 : 0)),
    C3: arredondarNota((d.paragrafos >= 4 ? 100 : 40) + (d.palavras >= 350 ? 60 : 20) + (d.temAnalise ? 40 : 0)),
    C4: arredondarNota(Math.min(200, 40 + d.conectivosDistintos * 25 + (d.totalConectivos >= 8 ? 35 : 0))),
    C5: arredondarNota(Object.values(d.elementos).filter(Boolean).length * 40),
  };

  // Um rascunho curto não deve receber nota alta: a extensão mínima é parte
  // da avaliação real. O fator reduz gradualmente as notas até ~350 palavras.
  const fatorExtensao = Math.min(1, 0.55 + 0.45 * Math.min(1, d.palavras / 380));
  const competencias = [
    { codigo: "C1", nome: "Domínio da norma culta" },
    { codigo: "C2", nome: "Compreensão da proposta e repertório" },
    { codigo: "C3", nome: "Organização e argumentação" },
    { codigo: "C4", nome: "Coesão e mecanismos linguísticos" },
    { codigo: "C5", nome: "Proposta de intervenção" },
  ].map((c) => ({
    ...c,
    nota: arredondarNota((notas[c.codigo] ?? 0) * fatorExtensao),
    feedback: feedbackCompetencia(c.codigo, d),
  }));

  const base: RevisaoResultado = {
    resumo,
    pontosFortes: d.pontosFortes.slice(0, 5),
    pontosMelhoria: d.pontosFracos.slice(0, 5),
    correcoes: d.correcoes,
    proximosPassos: [],
  };

  if (modo === "rapida") {
    return {
      resumo,
      pontosFortes: base.pontosFortes,
      pontosMelhoria: base.pontosMelhoria,
      correcoes: [],
      competencias: undefined,
    };
  }

  if (modo === "gramatical") {
    return {
      resumo: `${resumo} ${d.correcoes.length ? "Foram listadas sugestões de substituição para marcas de oralidade." : "Nenhum desvio evidente detectado pela varredura local; faça uma revisão manual de concordância e crase."}`,
      pontosFortes: base.pontosFortes,
      pontosMelhoria: base.pontosMelhoria,
      correcoes: d.correcoes.length
        ? d.correcoes
        : [
            {
              original: "(varredura local)",
              correcao: "revisão manual",
              explicacao: "Este modo local detecta padrões predefinidos. Para erros de concordância, regência e crase, conecte uma chave de IA ou revise com um corretor humano.",
            },
          ],
      competencias: undefined,
    };
  }

  const faltantes = Object.entries(d.elementos)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  return {
    ...base,
    competencias,
    notaEstimada: competencias.reduce((acc, c) => acc + c.nota, 0),
    proximosPassos: [
      ...d.pontosFracos.slice(0, 3),
      ...(faltantes.length ? [`Complete na conclusão: ${faltantes.join(", ")}.`] : []),
      `Marque os ${CHECKLIST.length} itens do Checklist no Guia ENEM e reescreva o parágrafo mais fraco.`,
      "Para uma correção por competência feita por IA, configure GEMINI_API_KEY no servidor.",
    ],
  };
}

export { AVISO_LOCAL };
