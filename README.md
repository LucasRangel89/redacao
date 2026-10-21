# 🖊️ Redação Nota Máxima AI

> **Elevando o padrão da escrita acadêmica com IA Generativa.**

Plataforma inteligente de auxílio à escrita que guia estudantes **desde o planejamento estrutural até a revisão técnica profunda** de redações dissertativo-argumentativas no estilo ENEM/Concursos. Diferente de um chatbot genérico, o app aplica uma metodologia de **andaime (scaffolding)**: força o estudante a pensar na estrutura — tese, repertório, conectivos e proposta de intervenção — *antes* de produzir o texto final, mantendo a autoria da escrita.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Sobre o projeto

| | |
|---|---|
| **Categoria** | EdTech · Assistente de Escrita Inteligente |
| **Público-alvo** | Estudantes de ensino médio, vestibulandos e candidatos a concursos públicos |
| **Objetivo** | Mitigar o "bloqueio da página em branco" e elevar a qualidade técnica de redações dissertativo-argumentativas |
| **Interface** | Dark Mode produtivo com paleta sóbria Slate/Blue para reduzir o cansaço visual em longas sessões de escrita |

## ✨ Funcionalidades

### 🔄 Fluxo guiado em 3 etapas
O fluxo é dividido em três etapas lógicas — **Setup → Arquitetura → Escrita** — impedindo que o usuário pule etapas críticas de planejamento antes da redação final.

### 1️⃣ Gerador de Temas Atualizados
- Utiliza **Grounded Search** (busca fundamentada na web) para sugerir temas baseados em **debates reais da sociedade brasileira**
- Temas no formato ENEM com textos motivadores
- Suporte a temas manuais (provas da escola, concursos)

### 2️⃣ Arquitetura de Argumentos
Sistema modular para construção de cada parágrafo de desenvolvimento:
- **Tópico Frasal** — a afirmação que encerra a discussão
- **Repertório** — sugerido por IA com critério de produtividade (filosófico, sociológico, dados estatísticos, histórico, legal, cultural)
- **Análise** — a conexão causal entre repertório e tese
- Sugestão de **plano completo** (tese + argumentos) com um clique

### 3️⃣ Proposta de Intervenção Estruturada
Formulário específico para os **5 elementos obrigatórios do ENEM**: Agente, Ação, Meio/Modo, Finalidade e Detalhamento — com gerador que entrega os elementos e um esqueleto para o estudante redigir com as próprias palavras.

### 4️⃣ Revisão Multimodal
Diferentes motores de IA para diferentes necessidades (arquitetura de modelos híbrida):

| Motor | Uso | Latência |
|---|---|---|
| **Pro** | Análise profunda pelas 5 competências + nota estimada /1000 | alta |
| **Flash** | Chat do mentor socrático, revisão gramatical, síntese de busca | média |
| **Flash-Lite** | Revisões rápidas, sugestões de repertório | baixa |

A implementação usa a API do **Google Gemini (séries 3 Pro, 3 Flash e Flash-Lite)** quando a chave `GEMINI_API_KEY` está configurada — e faz **fallback automático** para o provedor de IA embutido, garantindo funcionamento out-of-the-box.

### 5️⃣ Ferramentas de suporte sem perder contexto
Tabs laterais mantêm o foco no editor central:
- 💬 **Mentor** — tutor socrático que *questiona e guia* em vez de escrever pelo aluno
- 🔎 **Busca** — checagem de fatos e dados estatísticos com fontes, integrada à escrita
- 📝 **Revisão** — três modais de análise (rápida / gramatical / profunda)

### Extras de produtividade
- Folha de redação com **linhas estilo prova**, contador de palavras/parágrafos e progresso até as 30 linhas do ENEM
- **Timer de sessão** (KPI de tempo médio de planejamento)
- **Salvamento automático** em `localStorage` — nunca perca o rascunho
- Botão "Nova redação" com confirmação

## 🛠️ Stack tecnológica

- **[Next.js 16](https://nextjs.org)** (App Router) + **React 19** + **TypeScript 5**
- **[Tailwind CSS 4](https://tailwindcss.com)** + **shadcn/ui** (componentes) + **Lucide** (ícones)
- **[Zustand](https://zustand.docs.pmnd.rs)** com persistência — estado da redação
- **[Sonner](https://sonner.emilkowal.ski)** — notificações
- **IA**: Google Gemini API (REST, sem dependências extras) + fallback `z-ai-web-dev-sdk`
- **Grounded Search** para temas e checagem de fatos

## 🚀 Como rodar

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/redacao-nota-maxima-ai.git
cd redacao-nota-maxima-ai

# 2. Instale as dependências
bun install   # ou npm install / pnpm install

# 3. Configure as variáveis de ambiente (opcional)
cp .env.example .env
# Edite .env e adicione GEMINI_API_KEY=... para usar os modelos Gemini

# 4. Rode em desenvolvimento
bun run dev   # ou npm run dev

# 5. Abra http://localhost:3000
```

> 💡 **Sem chave do Gemini?** O app funciona igualmente: as rotas de IA usam o provedor de IA embutido do ambiente como fallback. Com `GEMINI_API_KEY`, a arquitetura híbrida roteia cada tarefa para o motor mais adequado.

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── page.tsx                 # Orquestração das 3 etapas
│   ├── layout.tsx               # Dark mode + metadados
│   └── api/                     # Rotas de IA (server-side)
│       ├── temas/               # Grounded search → temas ENEM
│       ├── arquitetura/         # Tese + argumentos (motor Pro)
│       ├── repertorio/          # Bancos de repertório produtivo
│       ├── intervencao/         # 5 elementos da proposta
│       ├── revisao/             # 3 modais de revisão
│       ├── chat/                # Mentor socrático
│       └── busca/               # Checagem de fatos com fontes
├── components/redacao/
│   ├── app-header.tsx           # Stepper + timer da sessão
│   ├── setup-stage.tsx          # Etapa 1: temas
│   ├── arquitetura-stage.tsx    # Etapa 2: scaffolding
│   ├── escrita-stage.tsx        # Etapa 3: folha + stats
│   ├── side-panel.tsx           # Tabs Mentor/Busca/Revisão
│   └── markdown.tsx             # Render das respostas da IA
├── lib/
│   ├── ai.ts                    # Camada de IA híbrida (Gemini ↔ fallback)
│   ├── store.ts                 # Zustand + persistência + stats do texto
│   └── types.ts                 # Tipos compartilhados
└── ...
```

**Decisões de design**: o balanceamento entre profundidade (latência do modelo Pro) e velocidade (durante a escrita) é resolvido pela **arquitetura de modelos híbrida** — cada rota declara o motor ideal para sua tarefa. Os prompts de sistema são calibrados para que a IA **não escreva para o usuário**, mas o **questionie e guie**.

## 📊 Métricas acompanhadas

- ⏱️ Tempo médio de planejamento da redação (timer de sessão)
- ✍️ Taxa de conclusão do rascunho (progresso de linhas)
- 🎯 Precisão do feedback gramatical (modo de revisão C1)

## 🗺️ Roadmap

- [ ] Transcrição de voz para áudio-redação
- [ ] Exportação direta para PDF com folha de correção oficial
- [ ] Histórico de redações e comparativo de evolução
- [ ] Modo treino cronometrado (simulação de prova real)

## 🤝 Contribuindo

Contribuições são bem-vindas! Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para saber como configurar o ambiente e submeter sua contribuição.

## 📄 Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.
