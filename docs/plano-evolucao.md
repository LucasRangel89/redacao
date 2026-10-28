# Plano de evolução — Redação Nota Máxima AI

> Documento vivo para as próximas conversas/iterações. Registre aqui decisões,
> escopos e critérios de aceite. **Última atualização:** 2026-10-27.
>
> Plano curto no [README](../README.md) ·
> Acervo em [`docs/acervo-redacoes.md`](acervo-redacoes.md) ·
> Visão de produto em [`docs/visao-produto.md`](visao-produto.md).

> **Decisão de produto (2026-10-27):** o projeto é, neste momento, de **uso
> exclusivamente pessoal** (notebook + eventualmente celular/tablet de um mesmo
> usuário). Um sistema de contas multiusuário (Auth.js + Prisma/Postgres) seria
> over-engineering. O P0.1 foi **redefinido** para portabilidade de dados sem
> login; a versão com autenticação real fica adiada como **P0.1B**.
> Detalhes e critérios de aceite revisados na seção 4.

## 1. Como usar este plano

- **Para continuar em uma nova conversa:** copie o prompt da [seção 7](#7-prompt-pronto-para-uma-nova-conversa),
  cole no início do chat e substitua `[FASE/ITEM]` pelo que deseja implementar.
- **Para planejar:** a [seção 4](#4-backlog-priorizado) é a fonte de verdade.
  Cada item tem escopo, arquivos sugeridos e critérios de aceite verificáveis.
- **Ao concluir um item:** marque o checkbox, atualize o README e rode a
  [definição de pronto](#6-definição-de-pronto-dod).

## 2. Estado atual (baseline desta iteração)

| Camada | Situação |
|---|---|
| UI | App shell com 5 views (`inicio`, `estudio`, `biblioteca`, `guia`, `progresso`) em `src/app/page.tsx` |
| Estado | Zustand com persistência `localStorage` (chave `redacao-nota-maxima`, versão 3) em `src/lib/store.ts` |
| Acervo | `docs/acervo-redacoes.md` → `src/data/recursos.json` via `scripts/parse-recursos.mjs`; 9 temas, 22 redações, 59 citações |
| Guia | Conteúdo curado estático em `src/data/guia.ts` |
| IA | Rotas em `src/app/api/*` (Gemini ou SDK embutido) + fallback local em `src/lib/local-ai.ts`, orquestrado por `src/lib/api.ts` |
| Diagnóstico local | 26 regras puras e testáveis em `src/lib/analise-texto.ts` (concordância, crase, regência, pontuação, oralidade, repetição, coesão, análise de repertório) |
| Deploy | `npm run build:pages` → `out/` → `actions/deploy-pages` (GitHub Pages, `basePath: /redacao`); `npm run build` → standalone com Node |
| Qualidade | `npm run typecheck`, `npm run lint`, `ci.yml` (ambos os builds em PRs), `deploy-pages.yml` (publish na `main`) |
| Dados do usuário | 100% locais, sem login; `historico`, `favoritos`, `checklist`, `provaAte` no store; backup/restore em arquivo JSON (P0.1) |
| Repertórios | 20 itens verificados em `src/data/repertorios-verificados.json` + 59 citações do acervo (não verificadas, com aviso) |

**Dívidas conhecidas (resolver antes de escalar):**

- O acervo original ainda tem citações com atribuição possivelmente imprecisa —
  a UI avisa e a aba "Verificados" oferece alternativa conferida; falta expandir
  a curadoria verificada.
- `prisma/schema.prisma` usa SQLite e não tem modelos de usuário/turma
  (proposital: P0.1B adiado).
- O diagnóstico local cobre 26 padrões de alta precisão, mas não faz análise
  sintática completa (sujeitos longos, crase facultativa, regência de verbos
  raros). Para esses casos, use IA configurada ou corretor humano.
- A troca de dispositivo é manual (arquivo de backup do P0.1); sem P0.1B não há
  sincronização automática.
- Não há service worker: “modo local” ainda depende de carregar o site pela rede.

## 3. Princípios imutáveis

1. **A IA guia e questiona; nunca escreve pelo estudante.**
2. **Modo local é cidadão de primeira classe:** toda feature nova continua útil
   sem `GEMINI_API_KEY` e sem servidor (GitHub Pages).
3. **IA apenas no backend** (`src/app/api/*`), com Zod + rate limit.
4. **TypeScript estrito**, sem `any` injustificado; componentes `shadcn/ui` existentes.
5. **Privacidade primeiro:** dados sensíveis de estudantes exigem consentimento
   explícito antes de qualquer sincronização em nuvem.
6. **Honestidade de avaliação:** notas automáticas são estimativas didáticas,
   nunca apresentadas como nota oficial do ENEM.

## 4. Backlog priorizado

### P0 — Fase 1: fundação de dados e identidade

#### ✅ P0.1 · Portabilidade de dados sem login (CONCLUÍDO em 2026-10-27)
> **Decisão:** uso pessoal em notebook + celular/tablet de **um único usuário**.
> Auth multiusuário seria over-engineering. Implementamos uma "maleta": o usuário
> baixa um arquivo JSON num aparelho e restaura no outro. Ver **P0.1B** para a
> versão com conta/nuvem, adiada.

- **Valor:** levar histórico, favoritos, checklist e rascunho entre aparelhos, sem
  senha, sem servidor, sem custo e sem enviar dados a terceiros.
- **Esforço:** M (concluído).
- **Escopo entregue**
  - `src/lib/backup.ts` — módulo puro: geração, serialização, validação/saneamento,
    resumo e mesclagem sem duplicatas.
  - `src/components/redacao/dados-pessoais-card.tsx` — "Meus dados" em Progresso:
    **Baixar meus dados**, **Restaurar de arquivo** (Juntar / Substituir) e
    **Apagar tudo** (LGPD).
  - Atalho "Meus dados" no Início; ações `aplicarBackup`/`apagarTudo` no store;
    `RedacaoSalva` movido para `src/lib/types.ts`.
  - Limites anti-abuso: 3 MB por arquivo, 200 versões, textos de até 20.000
    caracteres, checklist restrito aos IDs conhecidos.
  - 8 testes em `tests/backup.test.ts`.
- **Critérios de aceite**
  - [x] Exportar → importar preserva histórico, favoritos, checklist e rascunho.
  - [x] "Juntar" nunca duplica versões idênticas e **nunca apaga** um rascunho
    em andamento no aparelho atual.
  - [x] "Substituir" troca tudo mediante confirmação explícita.
  - [x] Arquivo inválido/corrompido gera mensagem em português, sem travar o app.
  - [x] Funciona 100% no build estático do GitHub Pages (sem `/api`, sem login).
  - [x] "Apagar tudo" remove os dados de `localStorage` deste navegador.

#### ⏸️ P0.1B · Conta + sincronização automática (ADIADO)
- **Quando retomar:** se o app passar a ser usado por mais pessoas, ou se o
  usuário quiser sincronização automática sem carregar arquivo manualmente.
- **Escopo:** Auth.js v5 (Google + magic link), Prisma/PostgreSQL, endpoints
  `GET/POST /api/redacoes`, `GET/PATCH/DELETE /api/redacoes/:id`, merge local →
  nuvem por `createdAt` + hash, exportação/exclusão de dados (LGPD).
- **Trade-offs registrados:** Auth.js/Prisma dão OAuth e migrations prontos, mas
  adicionam ~30–40 dependências, `prisma generate` obrigatório no CI, engines com
  download externo e necessidade de provedor de e-mail/credenciais Google.
  Alternativa leve: sessão assinada (Web Crypto) + repositório plugável
  (JSON em dev / `pg` em produção), sem engines externos.
- **Riscos:** modo anônimo deve continuar funcionando; nenhum dado pode sair do
  aparelho sem consentimento explícito; `build:pages` precisa seguir passando.

#### ✅ P0.2 · Banco de repertórios verificados (CONCLUÍDO em 2026-10-27)
- **Valor:** combate citações inventadas/atribuídas errado — maior risco pedagógico atual.
- **Esforço:** M (concluído).
- **Escopo**
  - Novo `src/data/repertorios-verificados.ts` com campos
    `{ id, tipo, texto, autor, fonte, url, ano, verificadoEm, area, comoUsar }`.
  - Curadoria inicial: Constituição Federal/Lei 12.527, LGPD, Declaração Universal
    dos DH, dados do IBGE/INEP/IBGE-PNAD, obras clássicas com editora/ano.
  - Selo "Fonte verificada" na Biblioteca (difere das citações do acervo).
  - Filtro "Somente verificados" e aviso educativo nas não verificadas.
  - Script `scripts/validar-repertorios.mjs` que checa campos obrigatórios e URLs.
- **Arquivos entregues:** `src/data/repertorios-verificados.json` (20 itens),
  `src/data/repertorios-verificados.ts`, `scripts/validar-repertorios.mjs`,
  `tests/repertorios.test.ts` (9 testes), Biblioteca com aba "Verificados",
  selo de fonte, link para a fonte original e aviso nas citações não conferidas;
  `src/lib/local-ai.ts` prioriza verificados em `repertorioLocal` e `buscaLocal`.
- **Critérios de aceite**
  - [x] Nenhuma citação sem `autor` + `fonte` aparece como verificada
        (validador + CI bloqueiam).
  - [x] O gerador de repertório local prioriza itens verificados (teste dedicado).
  - [x] Aviso de conferência permanece visível para itens do acervo original.
  - [x] Paráfrases são rotuladas e nunca tratadas como citação literal.
  - [x] `npm run validar:repertorios` e `npm test` rodam no CI.

### P1 — Fase 2: qualidade da correção

#### P1.1 · Correção por IA calibrada com rubrica oficial
- **Valor:** feedback confiável por competência, evolução mensurável.
- **Esforço:** M.
- **Escopo**
  - Revisar `src/app/api/revisao/route.ts`: prompt com rubrica oficial das 5
    competências, exemplos de níveis 0/40/…/200 e obrigatoriedade de citar trechos.
  - Adicionar `justificativas` por competência e `confianca` (0–1) ao
    `RevisaoResultado` em `src/lib/types.ts`.
  - Validar com Zod e sanitizar notas (já existe).
  - Salvar `revisaoJson` no histórico (`salvarNoHistorico(nota)` já recebe a nota;
    estender para aceitar o objeto completo).
  - Mostrar na tela de Progresso a evolução por competência (C1–C5 em radar/barras).
- **Critérios de aceite**
  - [ ] Toda nota vem acompanhada de pelo menos um trecho citado do texto.
  - [ ] Fallback local continua disponível e rotulado como estimativa.
  - [ ] Histórico guarda o JSON da revisão e reexibe sem nova chamada à IA.

#### ✅ P1.2 · Diagnóstico local mais profundo (CONCLUÍDO em 2026-10-27)
- **Valor:** melhorar a experiência no GitHub Pages sem custo.
- **Esforço:** M (concluído).
- **Decisão de produto (explicada em linguagem simples):** havia dois caminhos —
  (A) regras escritas à mão no aparelho, ou (B) mandar o texto para uma IA. A
  opção B cobre mais casos, mas exige chave, servidor, custo e envia o texto do
  estudante para fora. Mantivemos a **A como padrão gratuito/offline** e a **B
  como opção** quando `GEMINI_API_KEY` existir. As regras são de alta precisão:
  preferimos avisar menos e acertar, em vez de "corrigir" texto correto.
- **Escopo entregue**
  - `src/lib/analise-texto.ts` — módulo puro com **26 regras** auto-documentadas
    em 8 categorias: concordância (5), crase (3), regência (3), pontuação (4),
    oralidade (8), repetição em janela de 30 palavras (1), coesão/conectivos
    repetidos (1) e repertório sem análise (1). Cada regra traz `exemploErro`,
    `exemploCorrecao` e `explicacao`.
  - `aplicarRegras()` garante ao menos **uma sugestão por categoria presente**
    (senão 10 erros de concordância esconderiam o aviso pedagógico de "citação
    sem análise"), deduplica, prioriza e limita a 14 itens.
  - `src/lib/local-ai.ts` — `revisaoLocal` virou orquestrador: consome
    `analisarTexto()` e monta resumo, competências, feedbacks e próximos passos.
    Modo gramatical sem achados agora devolve lista vazia (sem "correção" falsa).
  - `CorrecaoGramatical` ganhou `categoria` e `regra` opcionais — o painel
    Revisão exibe selo da categoria, nome da regra, trecho citado e sugestão.
  - Nova aba **Guia ENEM → Revisão local (26)** com o catálogo completo e o
    aviso de que é apoio didático, não nota oficial.
  - 15 testes em `tests/analise-texto.test.ts`, incluindo a bateria automática
    que roda **todas as regras** contra seus exemplos.
- **Critérios de aceite**
  - [x] 26 regras documentadas com exemplo de erro e correção (mínimo 12).
  - [x] Nenhum falso positivo em texto formal de controle nem em 10 frases
    corretas "parecidas" (testes dedicados).
  - [x] `npm run typecheck`, `npm run lint` e 32 testes passam.

#### P1.3 · Comparador de versões (diff)
- **Valor:** o estudante enxerga concretamente o que melhorou — reforço de aprendizado.
- **Esforço:** S/M.
- **Escopo**
  - Em Progresso, selecionar 2 versões e exibir diff lado a lado por parágrafo.
  - Destacar inclusões/exclusões com cores acessíveis (não só vermelho/verde).
  - Resumo: Δ palavras, Δ linhas, Δ nota estimada, Δ tempo de escrita.
- **Arquivos:** `src/components/redacao/progresso-view.tsx`, `src/lib/diff.ts`.
- **Critérios de aceite**
  - [ ] Funciona com 2+ versões salvas e sem IA.
  - [ ] Textos longos (> 5.000 caracteres) não travam a UI.

### P1.4 · Área do professor / turmas
- **Depende de:** P0.1.
- **Esforço:** L.
- **Escopo:** papéis `ALUNO | PROFESSOR`, criação de turma com código de convite,
  distribuição de temas com prazo, lista de entregas, devolutiva por competência
  (humana ou IA), exportação CSV da turma.
- **Riscos:** LGPD — consentimento e minimização de dados de menores de idade;
  nunca expor e-mail de alunos a outros alunos.
- **Critérios de aceite**
  - [ ] Professor vê apenas as turmas que criou.
  - [ ] Aluno não acessa notas/devolutivas de colegas.
  - [ ] Tema com prazo aparece no Estúdio com contagem regressiva.

### P2 — Fase 3: experiência e acesso

#### P2.1 · PWA offline real
- **Esforço:** M. **Arquivos:** `public/sw.js`, `src/app/manifest.ts`, registro no
  `page.tsx` (apenas em produção), `scripts/build-pages.mjs`.
- **Escopo:** cache de assets `_next` + `recursos.json`; fallback offline para `/`;
  aviso "você está offline, seus dados continuam salvos"; atualização de versão do SW.
- **Aceite:** com DevTools offline, recarregar a página mantém Biblioteca/Guia/editor.

#### P2.2 · Voz (ditado e leitura)
- **Esforço:** M. Usar Web Speech API no cliente (sem backend) com botão no editor;
  transcrever para rascunho e ler o texto em voz alta; *feature detection* e aviso
  de que o áudio não é enviado a servidores.
- **Aceite:** navegadores sem suporte exibem fallback discreto, sem quebrar o editor.

#### P2.3 · Acessibilidade WCAG 2.2 AA
- **Esforço:** M. Modo claro (`next-themes` já é dependência), contraste ≥ 4.5:1,
  foco visível, `aria-live` para status, navegação completa por teclado, reduzir
  movimento, auditar com axe em CI.
- **Aceite:** 0 violações críticas/ sérias no axe nas 5 views; `prefers-reduced-motion`.

#### P2.4 · Simulado oficial adaptativo
- **Esforço:** M. Evoluir o modo prova (60 min) com: cronômetro por etapa, folha
  oficial em PDF, tema surpresa sorteado, bloqueio opcional de ferramentas de IA,
  e plano de treino que sugere o próximo exercício com base na competência mais fraca.
- **Aceite:** modo simulado funciona offline; resultado alimenta o Progresso.

#### P2.5 · Observabilidade e analytics de aprendizagem
- **Esforço:** S/M. Métricas locais (tempo por etapa, competência mais fraca, taxa
  de conclusão do planejamento). Sem cookies de terceiros; dashboard agregado
  anônimo. KPIs: tempo médio de planejamento, conclusão de rascunho, evolução C1–C5.
- **Aceite:** métricas visíveis em Progresso; nenhum dado identificável enviado.

## 5. Sequenciamento recomendado

```text
Fase 1 (P0)  → ✅ P0.2 repertórios verificados · ✅ P0.1 backup sem login
               ⏸️ P0.1B conta + nuvem (adiado, uso pessoal)
Fase 2 (P1)  → ✅ P1.2 diagnóstico local (26 regras)
               → P1.3 diff de versões · P1.1 correção por IA calibrada
               → ⏸️ P1.4 área do professor (depende de P0.1B)
Fase 3 (P2)  → PWA offline, voz, acessibilidade, simulado, analytics
```

Fase 1 e P1.2 concluídos. Próximo passo recomendado: **P1.3** (comparador de
versões) — mostra concretamente o que melhorou entre rascunhos, funciona 100%
offline e sem infraestrutura. Não implemente P1.4 (área do professor) antes de
P0.1B.

## 6. Definição de pronto (DoD)

- [ ] `npm run typecheck` sem erros.
- [ ] `npm run lint` sem erros.
- [ ] `npm test` (32 testes) e `npm run validar:repertorios` passam.
- [ ] `npm run build` (Node) e `npm run build:pages` (estático) passam.
- [ ] Fluxo funciona em **modo local** (sem `GEMINI_API_KEY`) e em **modo IA**.
- [ ] Testado em viewport 375px e 1440px, sem console errors.
- [ ] Sem dados sensíveis em logs; rotas novas usam Zod + rate limit.
- [ ] README + este plano atualizados; item marcado como concluído.
- [ ] Migrations Prisma revisadas (quando aplicável) e `.env.example` atualizado.

## 7. Prompt pronto para uma nova conversa

Copie e cole o bloco abaixo no início de uma nova conversa, substituindo
`[FASE/ITEM]` pelo identificador desejado (ex.: `P0.2`, `Fase 1`).

```text
Você é um engenheiro sênior full-stack trabalhando no repositório
LucasRangel89/redacao (Next.js 16 + React 19 + TypeScript estrito + Tailwind 4).

CONTEXTO
- O app já tem 5 views (Início, Estúdio, Biblioteca, Guia ENEM, Progresso),
  acervo estruturado em src/data/recursos.json e modo local em src/lib/local-ai.ts.
- O deploy usa DOIS builds: `npm run build` (Node, rotas /api) e
  `npm run build:pages` (estático para GitHub Pages, sem /api).
- Leia ANTES de começar: README.md, CONTRIBUTING.md e
  docs/plano-evolucao.md (seção 4 = backlog com critérios de aceite).

TAREFA
Implemente [FASE/ITEM] conforme o plano, respeitando os princípios da seção 3:
1. A IA guia e questiona, nunca escreve pelo estudante.
2. Toda feature nova deve funcionar em MODO LOCAL, sem chave de IA e sem servidor.
3. IA apenas no backend (src/app/api/*), com validação Zod e rate limiting.
4. TypeScript estrito, componentes shadcn/ui existentes, PT-BR na UI.
5. Privacidade: nada de dados de estudantes em logs ou serviços de terceiros.
6. Notas automáticas são sempre apresentadas como estimativas didáticas.

ENTREGA
- Código + testes (node --test para lógica pura) + documentação atualizada.
- Marque o item como concluído em docs/plano-evolucao.md e atualize o roadmap
  do README com o que mudou.
- Rode e reporte: npm run typecheck, npm run lint, npm run build,
  npm run build:pages. Verifique o fluxo Início → Biblioteca → Guia →
  Estúdio → Escrita → Diagnóstico → Progresso em modo local e em modo IA.
- Se precisar de decisão de produto (ex.: provedor de auth, modelo de dados),
  proponha 2 alternativas com trade-offs antes de implementar.
```

## 7.1 Registro de validação da Fase 1 (2026-10-27)

| Verificação | Resultado |
| --- | --- |
| `npm run validar:repertorios` | ✓ 20 repertórios verificados · 13 com fonte primária · 7 obras de referência |
| `npm test` | ✓ 17 testes (9 de repertórios + 8 de backup), 0 falhas |
| `npm run typecheck` | ✓ sem erros |
| `npm run lint` | ✓ sem erros |
| `npm run build:pages` | ✓ `out/` gerado, `basePath: /redacao`, rotas `/api` restauradas |
| `npm run build` | ✓ standalone com as 8 rotas `/api/*` |
| E2E navegador · **modo local** | ✓ 14 etapas: Início → Biblioteca (Verificados) → Guia → Estúdio/Setup → Arquitetura → Escrita → Diagnóstico → Progresso → download → restauração "Juntar" → arquivo corrompido → "Apagar tudo"; **0 erros de console** |
| E2E navegador · **modo IA** | ✓ 10 etapas com `/api/status`, `/api/temas`, `/api/arquitetura` e `/api/revisao` **mockados** (sem chave real); fluxo completo + backup; **0 erros de console** |

> Observação honesta: o modo IA foi exercitado com respostas simuladas no
> navegador, porque este ambiente não possui `GEMINI_API_KEY`. A chamada real ao
> provedor continua dependendo da configuração de quem publicar o app em Node.

## 7.2 Registro de validação do P1.2 (2026-10-27)

| Verificação | Resultado |
| --- | --- |
| `npm ci` | ✓ lockfile sincronizado (sem alterações) |
| `npm run validar:repertorios` | ✓ 20 repertórios verificados |
| `npm test` | ✓ **32 testes** (9 repertórios + 8 backup + 15 análise de texto), 0 falhas |
| `npm run typecheck` / `npm run lint` | ✓ limpos |
| `npm run build:pages` / `npm run build` | ✓ ambos passam após as mudanças de UI |
| Bateria de regras | ✓ 26/26 detectam o próprio `exemploErro` e **nenhuma** sinaliza o `exemploCorrecao` |
| Falsos positivos | ✓ 0 em redação formal de controle e em 10 frases corretas "parecidas" |
| E2E navegador · **modo local** | ✓ 7 etapas: Guia → Revisão local (26 regras) → Estúdio → Escrita → Revisão categorizada → modo gramatical → atalho abre a aba certa → **viewport 375px sem overflow**; 0 erros de console |
| E2E navegador · **modo IA** | ✓ 3 etapas com `/api/status`, `/api/temas`, `/api/arquitetura` e `/api/revisao` **mockados**: detecção "IA online", catálogo disponível e diagnóstico da IA preservado; 0 erros de console |

> O modo IA segue validado por mocks (sem `GEMINI_API_KEY` neste ambiente). A
> refatoração de `local-ai.ts` não tocou em `src/lib/api.ts` nem nas rotas, e o
> fallback local continua disponível se uma chamada de IA falhar.

## 8. Notas de infraestrutura

- **GitHub Pages:** `Settings → Pages → Source = GitHub Actions`. O workflow
  `deploy-pages.yml` publica `out/` na `main`; `ci.yml` valida PRs e branches
  `arena/**`. `PAGES_BASE_PATH` deve continuar casando com
  `NEXT_PUBLIC_BASE_PATH` (padrão `/redacao`).
- **IA:** defina `GEMINI_API_KEY` em host com Node. Sem chave, `/api/status`
  informa `iaDisponivel: false` e o cliente usa `src/lib/local-ai.ts`.
- **Build estático:** `scripts/build-pages.mjs` move `src/app/api` temporariamente,
  limpa `.next` (evita validadores órfãos do `next dev`), roda o build e restaura
  as rotas em `finally`. Qualquer rota nova deve seguir esse contrato.
- **CI:** `npm ci` exige `package-lock.json` sincronizado; após mudar
  dependências, rode `npm install --package-lock-only` e commite o lock.
  `ci.yml` roda `npm run validar:repertorios`, `npm test`, typecheck, lint e
  os dois builds a cada PR / branch `arena/**`.
- **Dados pessoais:** não há banco nem login por padrão. O arquivo de backup
  (versão 1) é a única forma de mover dados entre aparelhos. Ao evoluir o
  formato, incremente `VERSAO_BACKUP` e implemente migração em
  `validarBackup()` — nunca descarte arquivos antigos sem avisar o usuário.
