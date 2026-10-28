# 🖊️ Redação Nota Máxima AI

> **Elevando o padrão da escrita acadêmica — com scaffolding metodológico, acervo navegável e IA quando disponível.**

Plataforma de treino de redações dissertativo-argumentativas (ENEM/Concursos) que guia estudantes **do planejamento à revisão**. Diferente de um chatbot genérico, aplica uma metodologia de **andaime (scaffolding)**: o estudante pensa a estrutura — tese, repertório, conectivos e proposta de intervenção — *antes* de escrever, mantendo a autoria.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌐 Por que o meu link do GitHub Pages mostrava só o README?

**Diagnóstico:** o GitHub Pages, configurado como *"Deploy from a branch → main → / (root)"*, serve **arquivos estáticos crus**. Este repositório é uma aplicação **Next.js** — não existe `index.html` na raiz, e as rotas `/api/*` precisam de um servidor Node. Sem `index.html`, o Pages exibe a única página que encontra: o `README.md`.

**Correção (já implementada neste repositório):**

1. Existe um workflow em [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) que roda `npm ci → npm run recursos → npm run build:pages` e publica a pasta `out/` (com `index.html` de verdade) via `actions/deploy-pages`.
2. No seu repositório, vá em **Settings → Pages → Build and deployment → Source** e selecione **GitHub Actions** (não "Deploy from a branch").
3. Faça um merge/push na `main` (ou rode manualmente em **Actions → Publicar no GitHub Pages → Run workflow**). O link passa a ser `https://<usuario>.github.io/redacao/`.

Branches de trabalho não publicam (o ambiente `github-pages` normalmente só autoriza a `main`), mas são validadas automaticamente pelo workflow **Validar build** (`ci.yml`): TypeScript, ESLint e os dois builds.

O build estático usa `basePath: /redacao` automaticamente (variável `PAGES_BASE_PATH`) e gera `out/.nojekyll`, sem o qual o Pages bloqueia a pasta `_next`. O ícone e o manifest também respeitam esse prefixo.

### Dois modos de publicação

| Modo | Comando | Onde | IA |
|---|---|---|---|
| **Estático (GitHub Pages)** | `npm run build:pages` → publiar `out/` | Qualquer host de arquivos estáticos | ❌ usa o **motor local** |
| **Servidor (recomendado para IA)** | `npm run build` + `npm run start` | Vercel, Render, Railway, Fly.io, Docker | ✅ Gemini ou SDK embutido |

No modo estático **todas as ferramentas continuam funcionando** — temas, arquitetura, repertórios, mentor socrático, busca no acervo, diagnóstico por competências, biblioteca, guia, histórico e PDF — porque o cliente cai automaticamente para `src/lib/local-ai.ts`, que usa o acervo versionado. A única diferença é que a revisão passa a ser heurística (e diz isso claramente ao usuário), em vez de uma correção por LLM.

> Para IA real em produção: configure `GEMINI_API_KEY` no host com Node. Sem chave, o app tenta o provedor embutido; se ele também falhar, `/api/status` avisa e o front-end assume o modo local sem quebrar nenhum botão.

---

## 📋 Sobre o projeto

| | |
|---|---|
| **Categoria** | EdTech · Assistente de Escrita Inteligente |
| **Público-alvo** | Estudantes de ensino médio, vestibulandos e candidatos a concursos públicos |
| **Objetivo** | Mitigar o "bloqueio da página em branco" e elevar a qualidade técnica de redações |
| **Interface** | App shell com 5 seções, Dark Mode Slate/Blue, responsivo (mobile-first), PWA |

## ✨ Funcionalidades

### 🧭 Navegação (novo)
Cinco seções acessíveis pelo cabeçalho (ou `Alt+1` … `Alt+5`): **Início**, **Estúdio**, **Biblioteca**, **Guia ENEM** e **Progresso**. O stepper de 3 etapas permanece dentro do Estúdio — você pode sair para consultar um repertório e voltar sem perder o rascunho.

- **Início** — visão geral, estado do ambiente (IA online / modo local), atalhos, retomada do rascunho e progresso do checklist.
- **Biblioteca** — acervo de **9 dossiês temáticos, 22 redações modelo, 59 citações do acervo e 20 repertórios com fonte verificada**, com busca, filtros por área/tipo, favoritos, leitura anotada por parágrafo (Introdução / Desenvolvimento / Conclusão) e ações "usar no plano" e "inserir no rascunho". Paráfrases vêm rotuladas para nunca virarem citação falsa.
- **Guia ENEM** — 5 competências, estrutura de cada bloco, fórmula da intervenção, conectivos clicáveis, checklist interativo persistente, plano de 7 dias e erros comuns.
- **Progresso** — versões salvas localmente, métricas, gráfico de evolução (palavras × nota estimada), exportação `.txt` e exclusão.

### 🔄 Fluxo guiado em 3 etapas (Estúdio)
**Setup → Arquitetura → Escrita** — o estudante não pula etapas críticas.

1. **Gerador de temas** — com IA (grounded search) ou, sem servidor, temas do acervo no formato ENEM com textos motivadores. Também aceita tema manual e temas vindos da Biblioteca.
2. **Arquitetura de argumentos** — tese, tópico frasal, repertório (6 categorias), análise e os 5 elementos da proposta de intervenção. Sugestões vêm da IA ou do motor local.
3. **Folha de redação** — linhas estilo prova, estatísticas em tempo real, painel Mentor/Busca/Revisão, salvamento automático, cópia, `.txt` e **PDF com folha de correção oficial** (grade C1–C5).

### 🧠 Ferramentas integradas
- 💬 **Mentor socrático** — questiona e guia, nunca escreve pelo aluno (também em modo local).
- 🔎 **Busca** — checagem de fatos na web com fontes clicáveis; sem servidor, busca no acervo com link direto para a Biblioteca.
- 📝 **Revisão** — três modos (rápida / gramatical / profunda). O modo local entrega um **diagnóstico heurístico honesto** por competência, com 26 regras de norma culta, trecho citado, pontos fortes, prioridades e próximos passos.

### 🔍 Revisão local (novo)

Mesmo sem IA e sem internet, o app roda **26 regras de alta precisão** no seu
próprio aparelho: concordância, crase, regência, pontuação, oralidade,
repetição de palavras em janela de 30 palavras, conectivos repetidos e
repertório citado sem análise. Cada aviso mostra **o trecho encontrado no seu
texto**, a sugestão de substituição e o motivo — nada de "nota" sem explicação.
A lista completa, com exemplos de erro e correção, está em
**Guia ENEM → Revisão local (26)**.

> É um apoio didático: as regras cobrem erros frequentes, mas não substituem um
> corretor humano. As notas exibidas são **estimativas didáticas**, nunca notas
> oficiais. Se você configurar `GEMINI_API_KEY` num servidor com Node, a revisão
> por IA continua disponível como opção.

### 📦 Seus dados em qualquer aparelho (novo)

O app é de **uso pessoal** e não tem login: seus textos ficam no navegador de cada
aparelho. Em **Início → Meus dados** (ou em **Progresso → Meus dados**) você pode:

- **Baixar meus dados** — gera um arquivo `.json` com histórico de versões,
  favoritos, checklist e o rascunho em andamento.
- **Restaurar de arquivo** — no celular/tablet, escolha **Juntar** (soma sem
  duplicar e mantém o que você está escrevendo) ou **Substituir tudo**.
- **Apagar tudo** — remove seus dados deste navegador (LGPD).

Leve o arquivo pelo Google Drive, e-mail ou WhatsApp. **Nada é enviado a
servidores**: a transferência depende só de você. Funciona inclusive no site
estático do GitHub Pages.

### ⚡ Produtividade (novo)
- **Modo prova** com contagem regressiva de 60 minutos no editor.
- **Histórico de versões** com métricas, gráfico e estimativa de nota.
- **Checklist ENEM** de 11 itens e **plano de treino de 7 dias**, ambos persistidos.
- **Favoritos** de temas, redações e citações.
- **Exportação em PDF** via impressão, com folha de correção oficial para corretor humano.
- Atalhos `Alt+1..5` (navegação) e `Ctrl/Cmd+S` (confirmação de salvamento).

---

## 🚀 Como rodar

```bash
git clone https://github.com/LucasRangel89/redacao.git
cd redacao
npm install                 # ou bun install / pnpm install
cp .env.example .env.local  # opcional — o app funciona sem chave
npm run dev                 # http://localhost:3000
```

> 💡 **Sem chave do Gemini e sem provedor embutido?** O app detecta automaticamente e funciona em **modo local** — nenhuma tela de erro.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (bind `0.0.0.0:3000`) |
| `npm run build` | Build de produção **standalone** com rotas `/api/*` |
| `npm run start` | Sobe o servidor de produção |
| `npm run build:pages` | Build **estático** em `out/` para GitHub Pages (restaura `/api` ao final) |
| `npm run recursos` | Regenera `src/data/recursos.json` a partir de `docs/acervo-redacoes.md` |
| `npm run validar:repertorios` | Valida autor/fonte/URL dos 20 repertórios verificados |
| `npm test` | 32 testes de lógica pura (`node --test` + `tsx`) |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run typecheck` | `tsc --noEmit` (TypeScript estrito) |

### Publicar no GitHub Pages manualmente

```bash
npm run recursos
npm run build:pages         # gera out/ com index.html + .nojekyll
# envie o conteúdo de out/ para a branch gh-pages ou use o workflow (recomendado)
```

Para site de usuário (`usuario.github.io`) ou domínio próprio na raiz, use `PAGES_BASE_PATH="" npm run build:pages`.

---

## 📚 O acervo

Os dois arquivos enviados como referência foram versionados em [`docs/`](docs/):

- `docs/acervo-redacoes.md` — corpus com redações, temas e citações (**fonte da verdade**).
- `docs/visao-produto.md` — documentação de produto/UX do projeto.

`scripts/parse-recursos.mjs` converte o markdown em dados estruturados (`src/data/recursos.json`): dossiês temáticos com enunciado ENEM, textos motivadores, redações modelo anotadas por função e banco de citações classificado por tipo de repertório. **Edite o markdown e rode `npm run recursos`** — o workflow de Pages faz isso automaticamente.

> As citações do acervo podem conter atribuições imprecisas — a interface avisa
> para conferir a fonte. Por isso existe também
> [`src/data/repertorios-verificados.json`](src/data/repertorios-verificados.json):
> 20 itens curados com autor, fonte, ano e link institucional. Rode
> `npm run validar:repertorios` após adicionar um item (o CI também valida).

---

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── page.tsx                   # App shell: alterna entre as 5 views
│   ├── layout.tsx · globals.css   # Metadata, dark mode, CSS de impressão
│   ├── manifest.ts · robots.ts · sitemap.ts
│   └── api/                       # Rotas de IA (Zod + rate limit) — só no build Node
│       ├── status/                # Diagnóstico do provedor de IA
│       ├── temas/ arquitetura/ repertorio/ intervencao/
│       └── revisao/ chat/ busca/
├── components/
│   ├── redacao/                   # Componentes de domínio
│   │   ├── app-header.tsx         # Nav global + stepper + timer + save
│   │   ├── dashboard-view.tsx     # Início
│   │   ├── biblioteca-view.tsx    # Acervo navegável + leitor anotado
│   │   ├── guia-view.tsx          # Guia ENEM + checklist + plano de treino
│   │   ├── progresso-view.tsx     # Histórico + gráfico de evolução
│   │   ├── dados-pessoais-card.tsx# Backup/restauração em arquivo (sem login)
│   │   ├── setup-stage.tsx · arquitetura-stage.tsx · escrita-stage.tsx
│   │   ├── side-panel.tsx         # Mentor / Busca / Revisão
│   │   └── markdown.tsx
│   └── ui/                        # shadcn/ui (apenas os usados)
├── data/
│   ├── recursos.json              # Gerado a partir de docs/acervo-redacoes.md
│   ├── repertorios-verificados.json / .ts  # 20 fontes curadas + helpers
│   └── guia.ts                    # Conteúdo curado do Guia ENEM
└── lib/
    ├── api.ts                     # Cliente único: backend ↔ fallback local
    ├── local-ai.ts                # Motor heurístico offline (temas, mentor, revisão…)
    ├── recursos.ts                # Acesso tipado + busca no acervo
    ├── analise-texto.ts           # 26 regras do diagnóstico local (puro, testável)
    ├── backup.ts                  # Geração/validação/mesclagem do backup (puro)
    ├── store.ts                   # Zustand (views, rascunho, histórico, favoritos)
    ├── ai.ts · rate-limit.ts · types.ts · utils.ts · validation.ts
scripts/
├── parse-recursos.mjs             # Markdown → JSON estruturado
├── validar-repertorios.mjs        # Integridade das fontes verificadas
└── build-pages.mjs                # Export estático seguro (move/restaura /api)
tests/
├── repertorios.test.ts            # 9 testes (fontes, filtros, priorização)
├── backup.test.ts                 # 8 testes (ida e volta, mesclagem, saneamento)
└── analise-texto.test.ts          # 15 testes (26 regras, falsos positivos, modos)
.github/workflows/
├── deploy-pages.yml               # Publicação real no GitHub Pages
└── ci.yml                         # Validação+testes+builds em PRs/branches
```

## 🔒 Segurança e qualidade

- Validação com **Zod** em todas as rotas API; rate limiting por IP; limites de caracteres.
- Camada de IA **apenas no backend**; nenhuma chave vaza para o cliente.
- `output: "export"` remove `headers()` (não suportado) — em produção Node os security headers permanecem.
- TypeScript estrito (`noUncheckedIndexedAccess`), ESLint 9, `reactStrictMode`.
- 32 testes (`node --test`) cobrindo repertórios verificados, backup/restauração
  e as 26 regras do diagnóstico local (incluindo bateria de falsos positivos);
  validador de integridade das fontes roda no CI.
- `beforeunload` para prevenir perda acidental; dados salvos apenas em
  `localStorage`. O arquivo de backup é validado e saneado antes de entrar no app
  (limites de tamanho, checklist restrito a IDs conhecidos, versões deduplicadas).

---

## 🗺️ Roadmap — o que já foi entregue e o que vem depois

> 📌 **Plano detalhado para as próximas conversas:** [`docs/plano-evolucao.md`](docs/plano-evolucao.md)
> traz backlog priorizado (P0/P1/P2), escopo, arquivos sugeridos, critérios de aceite,
> sequenciamento em fases, definição de pronto e um **prompt pronto para copiar e colar**
> em uma nova conversa.

**Entregue nesta iteração**
- [x] Interface navegável (5 seções) em vez de uma única página de wizard
- [x] Biblioteca interativa a partir do acervo enviado
- [x] Guia ENEM, checklist e plano de treino
- [x] Histórico de versões, favoritos e gráfico de evolução
- [x] Modo local (funciona 100% sem servidor/IA)
- [x] Build estático funcional para GitHub Pages + workflow de deploy
- [x] Exportação em PDF com folha de correção oficial
- [x] Modo prova cronometrado
- [x] **Banco de repertórios verificados** — 20 itens com autor, fonte, ano e link
  institucional; paráfrases rotuladas; aviso nas citações não conferidas
- [x] **Backup/restauração em arquivo** — levar dados entre notebook, celular e
  tablet sem login, sem servidor e sem custo (**P0.1 redefinido para uso pessoal**)
- [x] **Diagnóstico local mais profundo** (P1.2) — 26 regras de concordância,
  crase, regência, pontuação, oralidade, repetição e análise de repertório, com
  15 testes e catálogo visível no Guia; funciona 100% offline.

**Próximos passos sugeridos (por impacto)**
- [ ] **Comparador de versões** (P1.3, diff lado a lado) mostrando o que melhorou
  entre rascunhos — funciona offline e sem IA.
- [ ] **Correção por IA com rubrica oficial** (P1.1) — calibrar o prompt com
  redações nota 1000 reais e salvar o feedback por competência no histórico.
- [ ] **Conta + sincronização automática** (P0.1B, adiado) — só se o projeto
  deixar de ser de uso pessoal; ver trade-offs no plano.
- [ ] **Área do professor** — turmas, envio de temas, correção em lote e devolutiva padronizada.
- [ ] **Transcrição de voz** para rascunho ditado e leitura em voz alta da redação.
- [ ] **Simulado oficial** com cronômetro, folha em PDF e cronograma de treino adaptativo.
- [ ] **PWA offline real** (service worker) para estudar sem internet.
- [ ] **Acessibilidade**: modo claro, contraste ajustável, navegação por teclado auditada (WCAG 2.2 AA).
- [ ] **Analytics de aprendizagem** — tempo por etapa, competência mais fraca e sugestão automática de exercícios.

## 🤝 Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md). Princípios:

- **A IA guia e questiona, nunca escreve pelo estudante.**
- **TypeScript estrito** e validação em toda borda externa.
- **IA só no backend** — nunca importe SDKs de IA em componentes client.
- **Modo local é cidadão de primeira classe**: toda feature nova deve funcionar sem servidor.
- **Idioma**: português do Brasil na UI e nos prompts.

## 📄 Licença

MIT. Veja [LICENSE](LICENSE).
