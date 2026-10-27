/**
 * Conteúdo curado do Guia ENEM. É estático (sem IA) para funcionar em qualquer
 * ambiente — inclusive no GitHub Pages — e serve de referência durante a escrita.
 */

export interface Competencia {
  codigo: string;
  nome: string;
  resumo: string;
  comoGarantir: string[];
  errosComuns: string[];
  cor: string;
}

export const COMPETENCIAS: Competencia[] = [
  {
    codigo: "C1",
    nome: "Domínio da norma culta",
    resumo: "Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
    comoGarantir: [
      "Releia em voz baixa procurando concordância verbal e nominal.",
      "Verifique crase, regência e pontuação em cada período longo.",
      "Substitua gírias e marcas de oralidade por registros formais.",
    ],
    errosComuns: [
      "Fazer concordância com o termo mais próximo em vez do sujeito.",
      "Usar 'pra', 'tá', 'a gente', 'tipo' e outras marcas de oralidade.",
      "Trocar 'há' (tempo decorrido) por 'a' e vice-versa.",
    ],
    cor: "sky",
  },
  {
    codigo: "C2",
    nome: "Compreensão da proposta",
    resumo:
      "Compreender a proposta e aplicar conceitos das várias áreas do conhecimento para desenvolvê-la.",
    comoGarantir: [
      "Retome palavras-chave do enunciado já na introdução.",
      "Use repertório produtivo: dado, lei, autor, obra, fato histórico.",
      "Explique como o repertório comprova seu argumento (não apenas cite).",
    ],
    errosComuns: [
      "Tangenciar o tema ou defender tese diversa da proposta.",
      "Colar citação decorativa sem análise.",
      "Copiar trechos dos textos motivadores como se fossem autoria.",
    ],
    cor: "violet",
  },
  {
    codigo: "C3",
    nome: "Seleção e organização de argumentos",
    resumo:
      "Selecionar, relacionar e organizar informações em defesa de um ponto de vista.",
    comoGarantir: [
      "Defina uma tese explícita e mantenha-a até a conclusão.",
      "Cada parágrafo: tópico frasal → repertório → análise → fecho.",
      "Mostre a relação de causa e consequência entre argumentos.",
    ],
    errosComuns: [
      "Empilhar ideias sem encadeamento lógico.",
      "Repetir o mesmo argumento com outras palavras.",
      "Deixar o posicionamento implícito.",
    ],
    cor: "blue",
  },
  {
    codigo: "C4",
    nome: "Coesão e mecanismos linguísticos",
    resumo:
      "Demonstrar conhecimento dos mecanismos linguísticos necessários para a argumentação.",
    comoGarantir: [
      "Inicie parágrafos com conectivos adequados à relação pretendida.",
      "Use retomadas pronominais e sinônimos para evitar repetição.",
      "Varie a pontuação: vírgula, dois-pontos, travessão, ponto e vírgula.",
    ],
    errosComuns: [
      "Usar apenas 'e', 'mas', 'então' e 'também'.",
      "Repetir a mesma palavra-chave em todas as linhas.",
      "Conectar frases com vírgula quando caberia ponto.",
    ],
    cor: "cyan",
  },
  {
    codigo: "C5",
    nome: "Proposta de intervenção",
    resumo:
      "Elaborar proposta de intervenção que respeite os direitos humanos.",
    comoGarantir: [
      "Inclua os 5 elementos: agente, ação, meio, finalidade e detalhamento.",
      "Escolha um agente com poder real de execução.",
      "Detalhe um dos elementos com um mecanismo concreto de funcionamento.",
    ],
    errosComuns: [
      "Proposta genérica: 'o governo deve melhorar a situação'.",
      "Esquecer finalidade ou detalhamento.",
      "Propor medida que fere direitos humanos (anula C5).",
    ],
    cor: "emerald",
  },
];

export const ESTRUTURA = [
  {
    etapa: "Introdução",
    objetivo: "Contextualizar e apresentar a tese.",
    passos: [
      "Abra com um repertório ou dado que ilustre o problema.",
      "Relacione a abertura ao tema do enunciado.",
      "Feche com a tese: sua resposta direta à proposta (1–2 frases).",
      "Antecipe os dois argumentos que serão desenvolvidos, se desejar.",
    ],
    modelo:
      "[Repertório de abertura]. Nesse sentido, a discussão sobre [tema] evidencia que [problema]. Assim, [tese: medida A + medida B], uma vez que [causa 1] e [causa 2].",
  },
  {
    etapa: "Desenvolvimento 1 e 2",
    objetivo: "Comprovar a tese com argumentos bem encadeados.",
    passos: [
      "Tópico frasal: uma afirmação que resume o argumento.",
      "Repertório produtivo: dado, lei, autor, obra ou fato histórico.",
      "Análise: explique de que forma o repertório valida o tópico frasal.",
      "Fecho: retome a tese e prepare a transição para o próximo parágrafo.",
    ],
    modelo:
      "[Tópico frasal]. Isso pode ser constatado quando [repertório]. Tal contexto demonstra que [análise causal]. Portanto, [retomada da tese] torna-se indispensável.",
  },
  {
    etapa: "Conclusão",
    objetivo: "Retomar a tese e apresentar a proposta de intervenção completa.",
    passos: [
      "Retome a tese com outras palavras (não repita literalmente).",
      "Sintetize o encadeamento dos argumentos.",
      "Apresente os 5 elementos da proposta de intervenção.",
      "Feche com uma perspectiva de transformação social.",
    ],
    modelo:
      "Portanto, [retomada da tese]. Para isso, [AGENTE] deve [AÇÃO] por meio de [MEIO], com o objetivo de [FINALIDADE], [DETALHAMENTO: mecanismo/monitoramento]. Dessa forma, [desdobramento para a sociedade].",
  },
] as const;

export const INTERVENCAO_5 = [
  { nome: "Agente", pergunta: "Quem fará?", exemplo: "O Ministério da Educação, em parceria com as secretarias estaduais," },
  { nome: "Ação", pergunta: "O que será feito?", exemplo: "deve ampliar o programa de formação continuada de professores" },
  { nome: "Meio / Modo", pergunta: "Como?", exemplo: "por meio de cursos gratuitos em plataforma pública" },
  { nome: "Finalidade", pergunta: "Para quê?", exemplo: "a fim de reduzir a desigualdade de aprendizagem" },
  { nome: "Detalhamento", pergunta: "Que mecanismo garante?", exemplo: "com avaliação trimestral dos resultados por escola, o que permitirá corrigir rotas." },
] as const;

export const CONECTIVOS: { categoria: string; itens: string[] }[] = [
  {
    categoria: "Abertura / contextualização",
    itens: ["A princípio", "Em um primeiro momento", "Historicamente", "Na contemporaneidade", "É notório que"],
  },
  {
    categoria: "Adição",
    itens: ["Além disso", "Ademais", "Somado a isso", "Noutro viés", "Não obstante"],
  },
  {
    categoria: "Oposição / ressalva",
    itens: ["No entanto", "Entretanto", "Por outro lado", "Embora", "Ainda que", "Em contrapartida"],
  },
  {
    categoria: "Causalidade",
    itens: ["Porquanto", "Visto que", "Uma vez que", "Devido ao fato de que", "Consequentemente", "Dessa forma"],
  },
  {
    categoria: "Exemplificação / repertório",
    itens: ["A título de exemplo", "Segundo", "Conforme", "É o que demonstra", "Como aponta"],
  },
  {
    categoria: "Conclusão",
    itens: ["Portanto", "Logo", "Em suma", "Sendo assim", "Diante do exposto", "Dessarte"],
  },
];

export const CHECKLIST: { id: string; texto: string; competencia: string }[] = [
  { id: "ch1", texto: "Minha tese responde diretamente ao enunciado?", competencia: "C3" },
  { id: "ch2", texto: "Introdução contextualiza com repertório e fecha com tese?", competencia: "C2" },
  { id: "ch3", texto: "Cada parágrafo tem tópico frasal claro?", competencia: "C3" },
  { id: "ch4", texto: "Usei pelo menos 2 repertórios produtivos e os analisei?", competencia: "C2" },
  { id: "ch5", texto: "Há conectivos variados entre e dentro dos parágrafos?", competencia: "C4" },
  { id: "ch6", texto: "Evitei repetir palavras-chave em excesso?", competencia: "C4" },
  { id: "ch7", texto: "Revisitei concordância, regência, crase e pontuação?", competencia: "C1" },
  { id: "ch8", texto: "A conclusão retoma a tese com outras palavras?", competencia: "C3" },
  { id: "ch9", texto: "A proposta tem os 5 elementos obrigatórios?", competencia: "C5" },
  { id: "ch10", texto: "A intervenção respeita os direitos humanos?", competencia: "C5" },
  { id: "ch11", texto: "O texto tem entre 20 e 30 linhas (≈350–550 palavras)?", competencia: "Geral" },
];

export const PLANO_TREINO = [
  { dia: "Dia 1", foco: "Estrutura", tarefa: "Leia 2 redações modelo da Biblioteca e identifique tese, argumentos e conclusão." },
  { dia: "Dia 2", foco: "Repertório", tarefa: "Monte um banco pessoal com 6 citações e anote como usaria cada uma." },
  { dia: "Dia 3", foco: "Tese", tarefa: "Escreva 5 teses para temas diferentes em até 2 frases cada." },
  { dia: "Dia 4", foco: "Argumento", tarefa: "Treine o esqueleto tópico frasal → repertório → análise em 3 parágrafos." },
  { dia: "Dia 5", foco: "Intervenção", tarefa: "Escreva 3 propostas completas com os 5 elementos." },
  { dia: "Dia 6", foco: "Simulado", tarefa: "Faça uma redação cronometrada em 60 minutos no Modo Prova." },
  { dia: "Dia 7", foco: "Revisão", tarefa: "Rode o Diagnóstico local, corrija os pontos fracos e reescreva a introdução." },
];

export const ERROS_COMUNS = [
  { erro: "Fuga ao tema", correcao: "Sublinhe as palavras-chave do enunciado e releia cada parágrafo verificando se elas aparecem." },
  { erro: "Citação decorativa", correcao: "Depois de citar, escreva uma frase começando com 'Isso demonstra que…'." },
  { erro: "Proposta genérica", correcao: "Nomeie o agente, a ação, o meio, a finalidade e um detalhamento verificável." },
  { erro: "Repetição de 'é' e 'que'", correcao: "Troque por verbos de ação e por conectivos de causa/consequência." },
  { erro: "Oralidade", correcao: "Substitua 'pra', 'tá', 'a gente', 'né' e 'tipo' por formas formais." },
  { erro: "Parágrafo único", correcao: "Separe introdução, dois desenvolvimentos e conclusão — 4 blocos mínimos." },
];
