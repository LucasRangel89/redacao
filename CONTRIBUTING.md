# Contribuindo para o Redação Nota Máxima AI 🖊️

Obrigado pelo interesse em contribuir! Este projeto aplica metodologia de
scaffolding à escrita dissertativo-argumentativa — mantenha esse princípio em
toda contribuição: **a IA guia e questiona, nunca escreve pelo estudante**.

## Configuração do ambiente

1. **Fork** e clone o repositório:

```bash
git clone https://github.com/LucasRangel89/redacao.git
cd redacao
npm install        # ou bun install / pnpm install
```

2. **Variáveis de ambiente** (opcionais):

```bash
cp .env.example .env.local
# GEMINI_API_KEY é opcional — sem provedor de IA, o app usa o modo local
# (src/lib/local-ai.ts) e todas as ferramentas continuam funcionando.
```

3. **Rode o servidor de desenvolvimento:**

```bash
npm run dev
```

Abra http://localhost:3000.

4. **Qualidade antes de submeter:**

```bash
npm run validar:repertorios   # integridade do banco de fontes verificadas
npm test                     # node --test (lógica pura)
npm run lint
npm run typecheck
npm run build          # servidor Node com rotas /api
npm run build:pages    # estático para GitHub Pages (modo local)
```

## Padrões do projeto

- **Novas regras de revisão local** vão em `src/lib/analise-texto.ts`, no array
  `REGRAS` (use o helper `regraSimples` para padrões de regex). Toda regra exige
  `exemploErro` e `exemploCorrecao`: `tests/analise-texto.test.ts` falha se o
  exemplo de erro não for detectado ou se o exemplo corrigido gerar falso
  positivo. Prefira poucas regras precisas a muitas regras duvidosas.
- **TypeScript estrito** (`strict: true` + `noImplicitAny: true`).
  Evite `any`; justifique cada exceção com um comentário.
- **Validação nas bordas**: toda rota API deve usar `validateBody(req, schema)`
  com um schema Zod definido em `src/lib/validation.ts`. Não confie em inputs
  do cliente.
- **IA no backend apenas** — o SDK de IA nunca deve ser importado em
  componentes client; sempre via rotas em `src/app/api/*`.
- **Modo local é cidadão de primeira classe** — qualquer feature que dependa de
  IA precisa de equivalente em `src/lib/local-ai.ts`, pois o build de GitHub Pages
  não tem servidor. Use os wrappers de `src/lib/api.ts`.
- **Motores de IA** — declare o motor adequado (`pro`, `flash`, `flash-lite`)
  conforme a exigência de latência/profundidade:
  - `pro`: análise profunda (arquitetura, revisão completa 5 competências).
  - `flash`: interação durante a escrita (chat, gramática, intervenção).
  - `flash-lite`: sugestões rápidas e sínteses (repertório, busca, revisão rápida).
- **Rate limiting** — toda rota que chama IA deve invocar `rateLimit()` antes
  de processar. Use tetos coerentes com o custo da operação.
- **Componentes**: prefira os componentes `shadcn/ui` existentes em
  `src/components/ui`. Antes de adicionar um novo componente shadcn, confira
  se não há um já existente que resolva o problema (evitamos componentes
  órfãos).
- **Responsividade**: teste em viewport móvel (375px) e desktop; o painel
  lateral deve colapsar em drawer.
- **Idioma**: UI e prompts em português do Brasil.

## Adicionando uma nova feature de IA

1. Crie a rota em `src/app/api/<nome>/route.ts`;
2. Adicione o schema Zod em `src/lib/validation.ts`;
3. Escolha o motor (`pro`/`flash`/`flash-lite`) e aplique rate limit;
4. Trate erros com `HttpError` e `try/catch` com log no servidor;
5. Responda com JSON tipado conforme um tipo em `src/lib/types.ts`;
6. (Se necessário) Adicione ações no Zustand store e UI em um componente
   `src/components/redacao/`.

## Fluxo de PR

1. Crie uma branch descritiva: `feat/contagem-regressiva` ou `fix/...`.
2. Faça commits pequenos e claros; mantenha o `main` verde.
3. Garanta que `lint`, `typecheck` e `build` passam.
4. Descreva no PR: **o que muda**, **por quê** e **como testar**.

## Reportando bugs

Abra uma issue com: passos para reproduzir, comportamento esperado vs. obtido,
screenshots e, se envolver resposta de IA, o modo/motor utilizado.
