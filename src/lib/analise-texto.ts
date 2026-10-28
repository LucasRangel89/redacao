/**
 * Analisador heurístico de redação — módulo puro (P1.2).
 *
 * Regras de ALTA PRECISÃO escritas à mão, sem IA, sem servidor e sem efeitos
 * colaterais. O objetivo não é "corrigir" o texto (isso continua sendo trabalho
 * do estudante e, se houver chave, da IA no backend), mas apontar padrões
 * concretos de erro com um trecho citado e uma sugestão de substituição.
 *
 * Cada regra é auto-documentada: traz um exemplo de erro e um exemplo corrigido.
 * Os testes em tests/analise-texto.test.ts garantem que todo exemplo de erro é
 * detectado e que nenhum exemplo corrigido gera falso positivo.
 *
 * Honestidade: estas regras cobrem casos frequentes, não toda a gramática.
 * O resultado é sempre rotulado como diagnóstico didático, nunca nota oficial.
 */
import { CONECTIVOS } from "@/data/guia";
import type { CategoriaRegra, CorrecaoGramatical } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface Ocorrencia extends CorrecaoGramatical {
  regraId: string;
  regra: string;
  categoria: CategoriaRegra;
}

export interface Regra {
  id: string;
  nome: string;
  categoria: CategoriaRegra;
  /** Frase com o erro — DEVE ser detectada por detectar(). */
  exemploErro: string;
  /** Mesma ideia reescrita corretamente — NÃO deve ser detectada. */
  exemploCorrecao: string;
  explicacao: string;
  detectar(texto: string): Ocorrencia[];
}

export type RegraResumo = Omit<Regra, "detectar">;

export const ROTULO_CATEGORIA: Record<CategoriaRegra, string> = {
  concordancia: "Concordância",
  crase: "Crase",
  regencia: "Regência",
  pontuacao: "Pontuação",
  oralidade: "Oralidade",
  repeticao: "Repetição",
  coesao: "Coesão",
  argumentacao: "Argumentação",
};

/** Ordem de prioridade na lista de sugestões exibida ao estudante. */
export const ORDEM_CATEGORIAS: CategoriaRegra[] = [
  "concordancia",
  "crase",
  "regencia",
  "pontuacao",
  "oralidade",
  "argumentacao",
  "repeticao",
  "coesao",
];

/** Limite de sugestões exibidas para não transformar o painel em um muro de texto. */
export const LIMITE_OCORRENCIAS = 14;

// ---------------------------------------------------------------------------
// Utilitários de regex (fronteiras Unicode: \b falha em "é", "tá", "à")
// ---------------------------------------------------------------------------

const ESQ = String.raw`(?<![\p{L}\p{N}])`;
const DIR = String.raw`(?![\p{L}\p{N}])`;
const p = (fonte: string) => `${ESQ}(?:${fonte})${DIR}`;
const rx = (fonte: string, flags = "giu") => new RegExp(fonte, flags);
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const semAcentos = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function ocorrer(
  r: Pick<Regra, "id" | "nome" | "categoria" | "explicacao">,
  original: string,
  correcao: string
): Ocorrencia {
  return {
    regraId: r.id,
    regra: r.nome,
    categoria: r.categoria,
    original,
    correcao,
    explicacao: r.explicacao,
  };
}

interface ConfigSimples extends RegraResumo {
  regex: RegExp;
  corrigir: (m: RegExpExecArray) => string;
  original?: (m: RegExpExecArray) => string;
}

/** Constrói uma regra baseada em um único padrão, reportando no máximo 1 achado. */
function regraSimples(cfg: ConfigSimples): Regra {
  const base = {
    id: cfg.id,
    nome: cfg.nome,
    categoria: cfg.categoria,
    explicacao: cfg.explicacao,
  };
  return {
    id: cfg.id,
    nome: cfg.nome,
    categoria: cfg.categoria,
    exemploErro: cfg.exemploErro,
    exemploCorrecao: cfg.exemploCorrecao,
    explicacao: cfg.explicacao,
    detectar(texto: string) {
      // Regex nova a cada chamada: evita estado de lastIndex entre textos.
      const re = new RegExp(cfg.regex.source, cfg.regex.flags);
      const achados = [...texto.matchAll(re)];
      if (achados.length === 0) return [];
      const m = achados[0]!;
      const original = cfg.original
        ? cfg.original(m)
        : `${m[0].trim()}${achados.length > 1 ? ` (${achados.length}x)` : ""}`;
      return [ocorrer(base, original, cfg.corrigir(m))];
    },
  };
}

// ---------------------------------------------------------------------------
// Mapas de correção (chaves SEM acento, porque normalizamos o match)
// ---------------------------------------------------------------------------

const NOS_FORMAS: Record<string, string> = {
  vai: "vamos", tem: "temos", faz: "fazemos", e: "somos", foi: "fomos",
  esta: "estamos", precisa: "precisamos", deve: "devemos", pode: "podemos",
  quer: "queremos", diz: "dizemos", era: "eramos", possui: "possuimos",
  consegue: "conseguimos", vem: "vimos", mostra: "mostramos",
  apresenta: "apresentamos", indica: "indicamos",
};

const VERBOS_PLURAIS: Record<string, string> = {
  vai: "vão", tem: "têm", faz: "fazem", e: "são", foi: "foram",
  esta: "estão", precisa: "precisam", deve: "devem", pode: "podem",
  quer: "querem", diz: "dizem", mostra: "mostram", apresenta: "apresentam",
  indica: "indicam", era: "eram", possui: "possuem", consegue: "conseguem",
  vem: "vêm",
};

const VERBOS_SINGULARES: Record<string, string> = {
  vao: "vai", sao: "é", foi: "foi", foram: "foi", estao: "está",
  devem: "deve", podem: "pode", querem: "quer", fazem: "faz", tem: "tem",
  eram: "era", possuem: "possui", conseguem: "consegue", vem: "vem",
};

const VERBO_SING = String.raw`vai|tem|faz|é|foi|está|precisa|deve|pode|quer|diz|mostra|apresenta|indica|era|possui|consegue|vem`;
const VERBO_PLURAL = String.raw`vão|são|foram|estão|devem|podem|querem|fazem|têm|eram|possuem|conseguem`;

/** Substantivos que os estudantes costumam deixar no singular depois de artigo plural. */
const SUBSTANTIVOS_SINGULARES = [
  "pessoa", "criança", "mulher", "homem", "aluno", "professor", "escola",
  "empresa", "política", "questão", "situação", "solução", "medida", "lei",
  "pesquisa", "proposta", "família", "cidade", "comunidade", "país", "dado",
  "problema", "fator", "direito", "serviço", "programa", "projeto",
];

const SUBSTANTIVOS_PLURAIS: Record<string, string> = {
  pessoa: "pessoas", crianca: "crianças", mulher: "mulheres", homem: "homens",
  aluno: "alunos", professor: "professores", escola: "escolas", empresa: "empresas",
  politica: "políticas", questao: "questões", situacao: "situações",
  solucao: "soluções", medida: "medidas", lei: "leis", pesquisa: "pesquisas",
  proposta: "propostas", familia: "famílias", cidade: "cidades",
  comunidade: "comunidades", pais: "países", dado: "dados", problema: "problemas",
  fator: "fatores", direito: "direitos", servico: "serviços",
  programa: "programas", projeto: "projetos",
};

const FEMININOS_COM_CRASE = [
  "falta", "ausência", "educação", "saúde", "população", "sociedade", "escola",
  "lei", "pesquisa", "análise", "proposta", "solução", "medida", "política",
  "questão", "situação", "crise", "realidade", "importância", "necessidade",
  "qualidade", "vida", "cidade", "comunidade", "família", "empresa", "economia",
  "tecnologia", "informação", "comunicação", "água", "atenção", "aula",
  "atividade", "ação", "área",
].map(escapar).join("|");

// ---------------------------------------------------------------------------
// Regras simples (26 padrões de alta precisão)
// ---------------------------------------------------------------------------

const REGRAS_SIMPLES: Regra[] = [
  // ---- Concordância verbal / nominal -------------------------------------
  regraSimples({
    id: "C01", nome: 'Concordância com "nós"', categoria: "concordancia",
    exemploErro: "Nós vai precisar de mais tempo para estudar.",
    exemploCorrecao: "Nós vamos precisar de mais tempo para estudar.",
    explicacao: 'Com o sujeito "nós", o verbo vai para a 1ª pessoa do plural.',
    regex: rx(p(String.raw`nós\s+(${VERBO_SING})`)),
    corrigir: (m) => `nós ${NOS_FORMAS[semAcentos(m[1]!)]}`,
  }),
  regraSimples({
    id: "C02", nome: "Sujeito plural com verbo no singular", categoria: "concordancia",
    exemploErro: "Os alunos vai chegar atrasados na escola.",
    exemploCorrecao: "Os alunos vão chegar atrasados na escola.",
    explicacao: "Sujeito no plural pede verbo no plural: os alunos vão, não os alunos vai.",
    regex: rx(p(String.raw`(os|as|esses|essas|muitos|muitas|vários|várias|todos|todas)\s+([\p{L}]{3,}s)\s+(${VERBO_SING})`)),
    corrigir: (m) => `${m[1]} ${m[2]} ${VERBOS_PLURAIS[semAcentos(m[3]!)]}`,
  }),
  regraSimples({
    id: "C03", nome: "Sujeito singular com verbo no plural", categoria: "concordancia",
    exemploErro: "A sociedade devem cobrar mudanças do poder público.",
    exemploCorrecao: "A sociedade deve cobrar mudanças do poder público.",
    explicacao: "Sujeito no singular pede verbo no singular: a sociedade deve.",
    regex: rx(p(String.raw`(a|o)\s+([\p{L}]{3,})\s+(${VERBO_PLURAL})`)),
    corrigir: (m) => `${m[1]} ${m[2]} ${VERBOS_SINGULARES[semAcentos(m[3]!)]}`,
  }),
  regraSimples({
    id: "C04", nome: "Artigo plural com substantivo singular", categoria: "concordancia",
    exemploErro: "As pessoa precisa de apoio do Estado.",
    exemploCorrecao: "As pessoas precisam de apoio do Estado.",
    explicacao: "Artigo no plural exige substantivo no plural: as pessoas.",
    regex: rx(p(String.raw`(as|os|essas|esses|muitas|muitos|várias|vários|todas|todos)\s+(${SUBSTANTIVOS_SINGULARES.map(escapar).join("|")})`)),
    corrigir: (m) => `${m[1]} ${SUBSTANTIVOS_PLURAIS[semAcentos(m[2]!)]}`,
  }),
  regraSimples({
    id: "C05", nome: '"muito" antes de substantivo feminino plural', categoria: "concordancia",
    exemploErro: "Muito pessoas não têm acesso ao ensino superior.",
    exemploCorrecao: "Muitas pessoas não têm acesso ao ensino superior.",
    explicacao: 'O advérbio de intensidade concorda com o substantivo: "muitas pessoas".',
    regex: rx(p(String.raw`muito\s+(pessoas|crianças|escolas|medidas|políticas|questões|soluções|propostas|leis|pesquisas|empresas|mulheres|situações)`)),
    corrigir: (m) => m[0].replace(/muito/i, "muitas"),
  }),

  // ---- Crase -------------------------------------------------------------
  regraSimples({
    id: "K01", nome: "Crase depois de locução que exige preposição", categoria: "crase",
    exemploErro: "Devido a falta de investimento, a escola fechou.",
    exemploCorrecao: "Devido à falta de investimento, a escola fechou.",
    explicacao: 'Antes de palavra feminina depois de "devido a", "graças a" etc., use crase (à).',
    regex: rx(p(String.raw`(devido|graças|relativo|referente|concernente|obrigado|obrigada)\s+a\s+(${FEMININOS_COM_CRASE})`)),
    corrigir: (m) => m[0].replace(/(\s)a(\s)/, "$1à$2"),
  }),
  regraSimples({
    id: "K02", nome: 'Crase em "às vezes" e "à primeira vista"', categoria: "crase",
    exemploErro: "As vezes o Estado falha na proteção dos jovens.",
    exemploCorrecao: "Às vezes o Estado falha na proteção dos jovens.",
    explicacao: 'As locuções adverbiais "às vezes" e "à primeira vista" levam crase.',
    regex: rx(p(String.raw`(as\s+vezes(?!\s+(que|em|de|por))|a\s+primeira\s+vista)`)),
    corrigir: (m) => (semAcentos(m[1]!).startsWith("as") ? "às vezes" : "à primeira vista"),
  }),
  regraSimples({
    id: "K03", nome: '"afim de" junto é erro', categoria: "crase",
    exemploErro: "Afim de melhorar o ensino, o governo investiu.",
    exemploCorrecao: "A fim de melhorar o ensino, o governo investiu.",
    explicacao: 'A locução de finalidade é "a fim de" (separado); "afim" junto significa semelhante.',
    regex: rx(p(String.raw`afim\s+de`)),
    corrigir: () => "a fim de",
  }),

  // ---- Regência ----------------------------------------------------------
  regraSimples({
    id: "R01", nome: '"implica em" — preposição indevida', categoria: "regencia",
    exemploErro: "Isso implica em mudanças profundas na economia.",
    exemploCorrecao: "Isso implica mudanças profundas na economia.",
    explicacao: 'O verbo "implicar" é transitivo direto: implica algo, sem "em".',
    regex: rx(p(String.raw`implica(m)?\s+em`)),
    corrigir: (m) => m[0].replace(/\s+em$/i, ""),
  }),
  regraSimples({
    id: "R02", nome: '"consiste de" — preposição trocada', categoria: "regencia",
    exemploErro: "A proposta consiste de três etapas distintas.",
    exemploCorrecao: "A proposta consiste em três etapas distintas.",
    explicacao: 'A regência correta é "consistir em", não "consistir de".',
    regex: rx(p(String.raw`consiste(m)?\s+de`)),
    corrigir: (m) => m[0].replace(/\s+de$/i, " em"),
  }),
  regraSimples({
    id: "R03", nome: '"ao invés de" por "em vez de"', categoria: "regencia",
    exemploErro: "Ao invés de investir, o governo cortou verbas.",
    exemploCorrecao: "Em vez de investir, o governo cortou verbas.",
    explicacao: 'Para ideia de substituição, prefira "em vez de"; "ao invés de" indica oposição/contrário.',
    regex: rx(p(String.raw`ao\s+invés\s+de`)),
    corrigir: () => "em vez de",
  }),

  // ---- Pontuação e formatação -------------------------------------------
  regraSimples({
    id: "P01", nome: 'Vírgula antes de "mas"', categoria: "pontuacao",
    exemploErro: "O tema é relevante mas poucos o discutem.",
    exemploCorrecao: "O tema é relevante, mas poucos o discutem.",
    explicacao: 'A conjunção adversativa "mas" costuma vir precedida de vírgula.',
    regex: rx(String.raw`([\p{L}\p{N}]{2,})\s+mas${DIR}`),
    corrigir: (m) => `${m[1]}, mas`,
    original: (m) => `${m[0].trim()} (falta vírgula antes de "mas")`,
  }),
  regraSimples({
    id: "P02", nome: "Espaço antes da pontuação", categoria: "pontuacao",
    exemploErro: "O governo agiu , mas a desigualdade permaneceu.",
    exemploCorrecao: "O governo agiu, mas a desigualdade permaneceu.",
    explicacao: "Em português, o sinal de pontuação fica colado na palavra anterior.",
    regex: rx(String.raw`(\s+)([,.;:!?])`, "gu"),
    corrigir: (m) => `remover espaço antes de "${m[2]}"`,
    original: (m) => `espaço antes de "${m[2]}"`,
  }),
  regraSimples({
    id: "P03", nome: "Falta de espaço depois da pontuação", categoria: "pontuacao",
    exemploErro: "Portanto,o Estado deve agir com urgência.",
    exemploCorrecao: "Portanto, o Estado deve agir com urgência.",
    explicacao: "Depois de vírgula, ponto e vírgula, dois pontos ou ponto, use um espaço.",
    regex: rx(String.raw`([,;:!?])(?=[\p{L}])`, "gu"),
    corrigir: (m) => `${m[1]} + espaço`,
    original: (m) => `"${m[1]}" colado na palavra seguinte`,
  }),
  regraSimples({
    id: "P04", nome: "Espaços repetidos entre palavras", categoria: "pontuacao",
    exemploErro: "A  sociedade  deve cobrar soluções.",
    exemploCorrecao: "A sociedade deve cobrar soluções.",
    explicacao: "Use apenas um espaço entre as palavras; quebras de parágrafo ficam em linhas separadas.",
    regex: rx(String.raw`([\p{L}\p{N}])[ \t]{2,}([\p{L}\p{N}])`, "gu"),
    corrigir: (m) => `${m[1]} ${m[2]}`,
    original: () => "dois ou mais espaços entre palavras",
  }),

  // ---- Oralidade (mantidas da versão anterior, agora documentadas) -------
  regraSimples({
    id: "O01", nome: '"pra" no lugar de "para"', categoria: "oralidade",
    exemploErro: "Vamos pra escola mais cedo.",
    exemploCorrecao: "Vamos para a escola mais cedo.",
    explicacao: "Forma reduzida e oral; use a preposição formal.",
    regex: rx(p("pra")), corrigir: () => "para",
  }),
  regraSimples({
    id: "O02", nome: '"tá" no lugar de "está"', categoria: "oralidade",
    exemploErro: "A situação tá difícil para os jovens.",
    exemploCorrecao: "A situação está difícil para os jovens.",
    explicacao: "Forma oral do verbo estar; use a forma plena.",
    regex: rx(p("tá")), corrigir: () => "está",
  }),
  regraSimples({
    id: "O03", nome: 'Marca de oralidade "né"', categoria: "oralidade",
    exemploErro: "É um problema grave, né?",
    exemploCorrecao: "Trata-se de um problema grave.",
    explicacao: "Marcador de oralidade inadequado ao texto dissertativo-argumentativo.",
    regex: rx(p("né")), corrigir: () => "não é / reformule a frase",
  }),
  regraSimples({
    id: "O04", nome: '"a gente" — sujeito impreciso', categoria: "oralidade",
    exemploErro: "A gente precisa cobrar mudanças.",
    exemploCorrecao: "Os cidadãos precisam cobrar mudanças.",
    explicacao: "Substitua por sujeito formal e específico (cidadãos, população, Estado).",
    regex: rx(p(String.raw`a\s+gente`)), corrigir: () => "os cidadãos / a população",
  }),
  regraSimples({
    id: "O05", nome: "Abreviações de internet", categoria: "oralidade",
    exemploErro: "Vc sabe pq isso acontece.",
    exemploCorrecao: "Você sabe por que isso acontece.",
    explicacao: "Abreviações como vc, pq e msm não cabem na norma culta escrita.",
    regex: rx(p("vc|pq|msm")),
    corrigir: (m) => ({ vc: "você", pq: "porque", msm: "mesmo" })[semAcentos(m[0]!)] ?? "forma plena",
  }),
  regraSimples({
    id: "O06", nome: '"tipo" como marcador oral', categoria: "oralidade",
    exemploErro: "Faltam recursos, tipo, professores e livros.",
    exemploCorrecao: "Faltam recursos, como professores e livros.",
    explicacao: 'Prefira um conectivo de exemplificação: "como", "por exemplo".',
    regex: rx(p(String.raw`tipo(?=\s*,)`)), corrigir: () => "como / por exemplo",
  }),
  regraSimples({
    id: "O07", nome: '"em relação a" — locução desgastada', categoria: "oralidade",
    exemploErro: "Em relação a educação, ainda há lacunas.",
    exemploCorrecao: "No que se refere à educação, ainda há lacunas.",
    explicacao: 'Locução preferível na modalidade escrita formal: "no que se refere a".',
    regex: rx(p(String.raw`em\s+relação\s+a`)), corrigir: () => "no que se refere a",
  }),
  regraSimples({
    id: "O08", nome: '"a nível de" — expressão criticada', categoria: "oralidade",
    exemploErro: "A nível de governo faltam políticas claras.",
    exemploCorrecao: "No âmbito do governo faltam políticas claras.",
    explicacao: 'Prefira "no âmbito de", "em nível de" ou simplesmente "no".',
    regex: rx(p(String.raw`a\s+n[íi]vel\s+de`)), corrigir: () => "no âmbito de",
  }),
];

// ---------------------------------------------------------------------------
// Regras com lógica própria: repetição, coesão e análise do repertório
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(
  `a ao aos as às o os um uma umas uns de da das do dos e ou mas por para com sem
   em no na nos nas que quem qual quais se não sim é sao foi foram esta estao tem tem
   há ha como quando onde porque pois logo portanto tambem ainda ja mais menos muito
   muita muitos muitas todo toda todos todas esse essa esses essas este esta estes
   estas aquele aquela seu sua seus suas nosso nossa ele ela eles elas nos vos me te
   lhe lhes sera sera deve devem pode podem sobre entre apos ate desde perante conforme
   segundo alem ademais assim dessa deste nesse nesta diante mediante outros outras
   outro outra cada qualquer todas tudo nada algo alguem ninguem assim mesmo apenas
   sera seriam seria foram fosse fossem esteja estejam tenha tenham havia haviam
   diante disso essa isso aquilo ali aqui la onde entao enquanto contudo porem todavia
   primeira primeiro segundo segunda terceiro ultima ultimo`
    .split(/\s+/)
    .filter(Boolean)
);

const SINONIMOS: Record<string, string> = {
  educacao: "o ensino / a instrução escolar",
  sociedade: "a coletividade / o corpo social",
  governo: "o poder público / o Estado",
  pessoas: "os cidadãos / a população",
  problema: "o desafio / o entrave",
  problemas: "os desafios / os entraves",
  escola: "a instituição de ensino",
  alunos: "os estudantes / os discentes",
  brasil: "o país / a nação",
  estado: "o poder público / a unidade federativa",
  politicas: "as medidas / as ações governamentais",
  direitos: "as garantias / as prerrogativas",
  intervencao: "a proposta / a medida",
  desigualdade: "a disparidade / a assimetria social",
  investimento: "o aporte / o financiamento",
  jovens: "os adolescentes / a juventude",
};

interface Token { normal: string; original: string }

function tokenizar(texto: string): Token[] {
  return (texto.match(/[\p{L}\p{N}]+/gu) ?? []).map((t) => ({
    normal: semAcentos(t),
    original: t,
  }));
}

const baseRepeticao = {
  id: "Q01", nome: "Palavra repetida em janela de 30 palavras", categoria: "repeticao" as CategoriaRegra,
  explicacao: "Repetir a mesma palavra várias vezes em poucas linhas empobrece a coesão; use sinônimo, pronome ou retomada.",
};

/** Conta palavras de conteúdo repetidas >= 3x em qualquer janela de 30 tokens. */
export function detectarRepeticoes(texto: string, janela = 30, minimo = 3): Ocorrencia[] {
  const tokens = tokenizar(texto);
  const relatados = new Set<string>();
  const achados: Ocorrencia[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const alvo = tokens[i]!.normal;
    if (alvo.length < 5 || STOPWORDS.has(alvo) || relatados.has(alvo)) continue;
    const n = tokens.slice(i, i + janela).filter((t) => t.normal === alvo).length;
    if (n >= minimo) {
      relatados.add(alvo);
      achados.push(
        ocorrer(
          baseRepeticao,
          `"${tokens[i]!.original}" aparece ${n}x em até ${janela} palavras`,
          SINONIMOS[alvo] ?? "use sinônimo, pronome ou retomada"
        )
      );
      if (achados.length >= 3) break;
    }
  }
  return achados;
}

const regraRepeticao: Regra = {
  ...baseRepeticao,
  exemploErro: "A educação é importante. A educação transforma vidas. A educação reduz desigualdades.",
  exemploCorrecao: "A educação é essencial; esse processo transforma vidas e reduz desigualdades estruturais.",
  detectar: (texto) => detectarRepeticoes(texto),
};

const baseConectivos = {
  id: "Q02", nome: "Conectivo repetido três vezes ou mais", categoria: "coesao" as CategoriaRegra,
  explicacao: "Alternar conectivos de uma mesma categoria evita monotonia e mostra domínio das relações lógicas.",
};

function padraoLocucao(locucao: string): RegExp {
  const partes = semAcentos(locucao).trim().split(/\s+/).map(escapar);
  return rx(p(partes.join(String.raw`\s+`)));
}

const regraConectivos: Regra = {
  ...baseConectivos,
  exemploErro: "Ademais, a escola falha. Ademais, a família falha. Ademais, o Estado falha.",
  exemploCorrecao: "Além disso, a escola falha. Somado a isso, a família falha. Não obstante, o Estado falha.",
  detectar(texto) {
    const lower = semAcentos(texto);
    const achados: Ocorrencia[] = [];
    for (const grupo of CONECTIVOS) {
      for (const item of grupo.itens) {
        const n = [...lower.matchAll(padraoLocucao(item))].length;
        if (n < 3) continue;
        const alternativas = grupo.itens
          .filter((outro) => semAcentos(outro) !== semAcentos(item))
          .slice(0, 2);
        achados.push(
          ocorrer(
            baseConectivos,
            `"${item}" aparece ${n}x no texto`,
            alternativas.length ? `varie com: ${alternativas.join(" / ")}` : "use conectivos variados"
          )
        );
        if (achados.length >= 3) return achados;
      }
    }
    return achados;
  },
};

const MARCADOR_CITACAO = /(?:segundo|conforme|de\s+acordo\s+com|como\s+(?:afirma|aponta|diz|mostra|defende|sustenta)|dados\s+d[ao]s?|pesquisa|estudo|lei\s+n[ºo]?|artigo|“|")/iu;
const MARCADOR_ANALISE = /(?:isso\s+(?:demonstra|comprova|evidencia|revela|mostra|indica)|esse\s+(?:fato|dado|contexto)|tal\s+(?:fato|contexto)|o\s+que\s+(?:demonstra|evidencia|revela|comprova)|portanto|logo|dessa\s+forma|por\s+isso|assim,|diante\s+disso|nesse\s+sentido|percebe-se|evidencia-se)/iu;

const baseCitacao = {
  id: "Q03", nome: "Repertório sem análise explícita", categoria: "argumentacao" as CategoriaRegra,
  explicacao: "Citação, dado ou lei precisa ser comentado: mostre como ele comprova o seu argumento.",
};

const regraCitacao: Regra = {
  ...baseCitacao,
  exemploErro: "Segundo o IBGE, 30% dos jovens não concluem o ensino médio.",
  exemploCorrecao: "Segundo o IBGE, 30% dos jovens não concluem o ensino médio. Isso demonstra a urgência de políticas públicas.",
  detectar(texto) {
    const paragrafos = texto.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const achados: Ocorrencia[] = [];
    for (const paragrafo of paragrafos) {
      if (!MARCADOR_CITACAO.test(paragrafo)) continue;
      if (MARCADOR_ANALISE.test(paragrafo)) continue;
      achados.push(
        ocorrer(
          baseCitacao,
          `${paragrafo.slice(0, 70)}${paragrafo.length > 70 ? "…" : ""}`,
          "Acrescente uma análise: 'Isso demonstra que…'"
        )
      );
      if (achados.length >= 2) break;
    }
    return achados;
  },
};

/** Catálogo completo, na ordem em que as regras são avaliadas. */
export const REGRAS: Regra[] = [
  ...REGRAS_SIMPLES,
  regraRepeticao,
  regraConectivos,
  regraCitacao,
];

/** Versão serializável do catálogo, para exibir no Guia ENEM. */
export function listarRegras(): RegraResumo[] {
  return REGRAS.map((r) => ({
    id: r.id,
    nome: r.nome,
    categoria: r.categoria,
    exemploErro: r.exemploErro,
    exemploCorrecao: r.exemploCorrecao,
    explicacao: r.explicacao,
  }));
}

/** Executa todas as regras, deduplica, prioriza e limita o resultado. */
export function aplicarRegras(texto: string): Ocorrencia[] {
  if (!texto.trim()) return [];
  const todas: Ocorrencia[] = [];
  for (const regra of REGRAS) {
    // Uma regra com problema nunca deve derrubar o diagnóstico inteiro.
    try {
      todas.push(...regra.detectar(texto));
    } catch {
      /* isola a regra com falha */
    }
  }
  const vistos = new Set<string>();
  const unicas = todas.filter((o) => {
    const chave = `${o.regraId}|${o.original}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  const grupos = new Map<CategoriaRegra, Ocorrencia[]>();
  for (const c of ORDEM_CATEGORIAS) grupos.set(c, []);
  for (const o of unicas) {
    const alvo = grupos.get(o.categoria);
    if (alvo) alvo.push(o);
  }

  // 1ª passada: garante ao menos UMA sugestão de cada categoria presente.
  // Sem isso, 10 erros de concordância esconderiam o aviso de "citação sem
  // análise" ou de repetição — justamente os feedbacks mais pedagógicos.
  const resultado: Ocorrencia[] = [];
  for (const c of ORDEM_CATEGORIAS) {
    const primeiro = grupos.get(c)![0];
    if (primeiro) resultado.push(primeiro);
  }
  // 2ª passada: completa o limite com o restante, por ordem de prioridade.
  for (const c of ORDEM_CATEGORIAS) {
    for (const o of grupos.get(c)!.slice(1)) {
      if (resultado.length >= LIMITE_OCORRENCIAS) break;
      resultado.push(o);
    }
    if (resultado.length >= LIMITE_OCORRENCIAS) break;
  }
  const prioridade = (c: CategoriaRegra) => {
    const i = ORDEM_CATEGORIAS.indexOf(c);
    return i < 0 ? ORDEM_CATEGORIAS.length : i;
  };
  // Reordena sem perder a cota mínima: erros claros no topo, sugestões de estilo ao fim.
  return resultado
    .sort((a, b) => prioridade(a.categoria) - prioridade(b.categoria))
    .slice(0, LIMITE_OCORRENCIAS);
}

// ---------------------------------------------------------------------------
// Diagnóstico estruturado (consumido por revisaoLocal e chatLocal)
// ---------------------------------------------------------------------------

export interface Diagnostico {
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
  correcoes: CorrecaoGramatical[];
  ocorrencias: Ocorrencia[];
  porCategoria: Record<CategoriaRegra, number>;
  pontosFracos: string[];
  pontosFortes: string[];
}

const TODOS_CONECTIVOS = CONECTIVOS.flatMap((g) => g.itens.map((i) => semAcentos(i)));

export function analisarTexto(texto: string): Diagnostico {
  const palavras = tokenizar(texto).length;
  const blocos = texto.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const lower = semAcentos(texto);
  const conectivosEncontrados = TODOS_CONECTIVOS.filter((c) => lower.includes(c));
  const totalConectivos = TODOS_CONECTIVOS.reduce(
    (acc, c) => acc + (lower.split(c).length - 1),
    0
  );

  const ocorrencias = aplicarRegras(texto);
  const porCategoria = {} as Record<CategoriaRegra, number>;
  for (const c of ORDEM_CATEGORIAS) porCategoria[c] = 0;
  for (const o of ocorrencias) porCategoria[o.categoria] += 1;

  const correcoes: CorrecaoGramatical[] = ocorrencias.map((o) => ({
    original: o.original,
    correcao: o.correcao,
    explicacao: o.explicacao,
    categoria: o.categoria,
    regra: o.regra,
  }));

  const temCitacao = MARCADOR_CITACAO.test(texto);
  const temAnalise = MARCADOR_ANALISE.test(texto);
  const pontuacao = (texto.match(/[.,;:!?—]/g) ?? []).length;
  const repeticaoQue = (lower.match(/(?<![\p{L}\p{N}])que(?![\p{L}\p{N}])/gu) ?? []).length;
  // Penalidade limitada: 12 achados não podem zerar a competência C1.
  const formalidade = Math.max(15, 100 - Math.min(ocorrencias.length, 9) * 9);

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

  const avisos: [CategoriaRegra, string][] = [
    ["concordancia", "possível(is) erro(s) de concordância — confira sujeito, verbo e artigo."],
    ["crase", "ponto(s) de crase a conferir."],
    ["regencia", "regência verbal/preposicional a conferir."],
    ["pontuacao", "detalhe(s) de pontuação ou espaçamento."],
    ["oralidade", "marca(s) de oralidade inadequada(s) à norma culta."],
    ["argumentacao", "parágrafo(s) com repertório e sem análise explícita."],
    ["repeticao", "palavra(s) repetida(s) em janela curta — varie o vocabulário."],
    ["coesao", "conectivo(s) repetido(s) — diversifique as relações lógicas."],
  ];
  for (const [categoria, textoAviso] of avisos) {
    const n = porCategoria[categoria];
    if (n > 0) pontosFracos.push(`${n} ${textoAviso}`);
  }
  if (ocorrencias.length === 0) pontosFortes.push(`Nenhum dos ${REGRAS.length} padrões monitorados apareceu na varredura local — ainda assim, revise com leitura em voz alta.`);
  else pontosFracos.push(`${ocorrencias.length} sugestão(ões) da varredura local — veja a lista de correções com o trecho citado.`);
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
    correcoes,
    ocorrencias,
    porCategoria,
    pontosFracos,
    pontosFortes,
  };
}
