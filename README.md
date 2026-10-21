# 🖊️ Redação Nota Máxima AI

> **Elevando o padrão da escrita acadêmica com IA Generativa — com scaffolding metodológico.**

Plataforma inteligente de auxílio à escrita que guia estudantes **desde o planejamento estrutural até a revisão técnica profunda** de redações dissertativo-argumentativas no estilo ENEM/Concursos. Diferente de um chatbot genérico, o app aplica uma metodologia de **andaime (scaffolding)**: o estudante pensa a estrutura — tese, repertório, conectivos e proposta de intervenção — *antes* de produzir o texto final, mantendo a autoria da escrita.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColorwhite)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Sobre o projeto

| | |
|---|---|
| **Categoria** | EdTech · Assistente de Escrita Inteligente |
| **Público-alvo** | Estudantes de ensino médio, vestibulandos e candidatos a concursos públicos |
| **Objetivo** | Mitigar o "bloqueio da página em branco" e elevar a qualidade técnica de redações |
| **Interface** | Dark Mode produtivo com paleta sóbria Slate/Blue; responsivo (mobile-first) |

## ✨ Funcionalidades

### 🔄 Fluxo guiado em 3 etapas
**Setup → Arquitetura → Escrita** — o estudante não pode pular etapas críticas.

### 1️⃣ Gerador de Temas Atualizados
- **Grounded Search** (busca fundamentada na web) → temas baseados em debates reais
- Formato ENEM com textos motivadores
- Suporte a temas manuais (provas da escola, concursos)

### 2️⃣ Arquitetura de Argumentos
Sistema modular para cada parágrafo de desenvolvimento:
- **Tópico Frasal** — a afirmação que encerra a discussão
- **Repertório** — sugerido por IA com 6 categorias produtivas (filosófico, sociológico, dados, histórico, legal, cultural)
- **Análise** — conexão causal entre repertório e tese
- Plano completo (tese + 2–3 argumentos) gerado com um clique

### 3️⃣ Proposta de Intervenção Estruturada
Formulário específico para os **5 elementos obrigatórios do ENEM** (Agente, Ação, Meio/Modo, Finalidade, Detalhamento), com gerador que entrega os elementos e um esqueleto para o estudante redigir com as próprias palavras.

### 4️⃣ Revisão Multimodal (arquitetura híbrida)

| Motor | Uso | Latência |
|---|---|---|
| **Pro** | Análise profunda 5 competências + nota /1000 | alta |
| **Flash** | Mentor socrático, revisão gramatical, síntese de busca | média |
| **Flash-Lite** | Revisões rápidas, repertório, checagem de fatos | baixa |

Usa **Google Gemini** (3 Pro / 3 Flash / Flash-Lite) quando `GEMINI_API_KEY` está configurada, com **fallback automático** para o provedor embutido, garantindo funcionamento out-of-the-box.

### 5️⃣ Ferramentas integradas (sem perder contexto)
- 💬 **Mentor** — tutor socrático que *questiona e guia*, nunca escreve pelo aluno
- 🔎 **Busca** — checagem de fatos e dados com síntese e fontes clicáveis
- 📝 **Revisão** — três modos (rápida / gramatical / profunda) com notas por competência

### Produtividade
- Folha de redação com **linhas estilo prova** (≈70 caracteres/linha, 30 linhas)
- **Estatísticas em tempo real**: palavras, parágrafos, progresso de linhas
- **Timer de sessão** desde a escolha real do tema
- **Salvamento automático** em `localStorage` + indicador visual "Salvo/Salvando…"
- **Aviso ao sair** da página com texto não salvo (beforeunload)
- Botões **Copiar texto** e **Baixar .txt**
- Atalho **Ctrl/Cmd+S** para confirmar salvamento
- Painel lateral responsivo (drawer no mobile)
- Editor com **auto-resize** conforme o texto cresce

## 🛠️ Stack tecnológica

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript 5 estrito**
- **[Tailwind CSS 4](https://tailwindcss.com)** (CSS-first) + componentes **shadcn/ui** + **Lucide** icons
- **[Zustand](https://zustand.docs.pmnd.rs)** com persistência em `localStorage`
- **[Sonner](https://sonner.emilkowal.ski)** — notificações
- **[Zod](https://zod.dev)** — validação de inputs em todas as rotas de API
- **IA**: Google Gemini REST (sem SDK) + fallback `z-ai-web-dev-sdk`
- **Grounded Search** via funções do SDK embutido

## 🔒 Segurança e qualidade

- ✅ Validação de inputs com **Zod** em todas as rotas API
- ✅ **Rate limiting** em memória por IP (diferentes tetos por endpoint)
- ✅ Sanitização de notas (0–200 / 0–1000)
- ✅ Limites de caracteres para evitar abuso de tokens
- ✅ Tratamento estruturado de erros (`HttpError`)
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- ✅ `reactStrictMode: true`, TypeScript estrito, ESLint com regras úteis
- ✅ `beforeunload` para prevenir perda acidental de trabalho

## 🚀 Como rodar

```bash
# 1. Clone o repositório
git clone https://github.com/LucasRangel89/redacao.git
cd redacao

# 2. Instale as dependências
npm install         # ou bun install / pnpm install

# 3. Configure variáveis de ambiente (opcional — o app funciona sem chave!)
cp .env.example .env.local
# Edite .env.local e adicione GEMINI_API_KEY=... para usar os modelos Gemini Pro/Flash/Flash-Lite.

# 4. Rode em desenvolvimento
npm run dev         # ou bun dev

# 5. Abra http://localhost:3000
```

> 💡 **Sem chave do Gemini?** O app funciona out-of-the-box usando o provedor embutido. Com `GEMINI_API_KEY`, a arquitetura híbrida roteia cada tarefa para o motor mais adequado.

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` | Build de produção (standalone) |
| `npm run start` | Sobe o servidor de produção |
| `npm run lint` | Verifica ESLint |
| `npm run typecheck` | Verifica tipos TypeScript (`tsc --noEmit`) |

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── page.tsx                   # Orquestração das 3 etapas
│   ├── layout.tsx                 # Metadata + dark mode + toaster
│   ├── globals.css                # Tema Slate/Blue (Tailwind 4 @theme inline)
│   ├── manifest.ts                # PWA manifest (metadata route)
│   ├── robots.ts · sitemap.ts     # SEO
│   └── api/                       # Rotas de IA (server-side, com Zod + rate limit)
│       ├── temas/                 # Grounded search → temas ENEM (flash)
│       ├── arquitetura/           # Tese + argumentos (pro)
│       ├── repertorio/            # Bancos de repertório produtivo (flash-lite)
│       ├── intervencao/           # 5 elementos da proposta (flash)
│       ├── revisao/               # 3 modais de revisão (motor por modo)
│       ├── chat/                  # Mentor socrático (flash)
│       └── busca/                 # Checagem de fatos com fontes (flash-lite)
├── components/
│   ├── redacao/                   # Componentes de domínio
│   │   ├── app-header.tsx         # Stepper + timer + save indicator
│   │   ├── setup-stage.tsx        # Etapa 1: temas
│   │   ├── arquitetura-stage.tsx  # Etapa 2: scaffolding
│   │   ├── escrita-stage.tsx      # Etapa 3: folha + stats + export
│   │   ├── side-panel.tsx         # Tabs Mentor/Busca/Revisão
│   │   └── markdown.tsx           # Render das respostas da IA
│   └── ui/                        # Componentes shadcn (apenas os usados)
└── lib/
    ├── ai.ts                      # Camada de IA híbrida (Gemini ↔ fallback)
    ├── rate-limit.ts              # Rate limit sliding-window em memória
    ├── store.ts                   # Zustand + persistência + estatísticas
    ├── types.ts                   # Tipos compartilhados
    ├── utils.ts                   # cn() helper
    └── validation.ts              # Schemas Zod + HttpError + validateBody
```

## 🗺️ Roadmap

- [ ] Persistência em banco (Prisma) — histórico de redações por usuário
- [ ] Autenticação (NextAuth)
- [ ] Exportação PDF com folha de correção oficial
- [ ] Comparativo de evolução entre redações
- [ ] Modo treino cronometrado (simulação de prova real)
- [ ] Transcrição de voz para redação

## 🤝 Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md).

Princípios:
- **A IA guia e questiona, nunca escreve pelo estudante.**
- **TypeScript estrito** e validação em toda borda externa.
- **IA só no backend** — nunca importe SDKs de IA em componentes client.
- **Idioma**: português do Brasil na UI e nos prompts.

## 📄 Licença

MIT. Veja [LICENSE](LICENSE).
