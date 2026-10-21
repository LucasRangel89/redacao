# Contribuindo para o Redação Nota Máxima AI 🖊️

Obrigado pelo interesse em contribuir! Este projeto aplica metodologia de
scaffolding à escrita dissertativo-argumentativa — mantenha esse princípio em
toda contribuição: **a IA guia e questiona, nunca escreve pelo estudante**.

## Configuração do ambiente

1. **Fork** e clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/redacao-nota-maxima-ai.git
cd redacao-nota-maxima-ai
bun install   # ou npm install
```

2. **Variáveis de ambiente** (opcional para desenvolvimento):

```bash
cp .env.example .env
# GEMINI_API_KEY é opcional — sem ela, o fallback de IA embutido é usado.
```

3. **Rode o servidor de desenvolvimento:**

```bash
bun run dev
```

4. **Verifique a qualidade antes do commit:**

```bash
bun run lint
```

## Padrões do projeto

- **TypeScript estrito** — nenhum `any` sem justificativa; tipos compartilhados em `src/lib/types.ts`.
- **Componentes** — prefira os componentes `shadcn/ui` existentes em `src/components/ui`.
- **IA no backend apenas** — o SDK de IA nunca deve ser importado em componentes client; sempre via rotas em `src/app/api/*`.
- **Motores de IA** — ao criar uma rota nova, declare o motor adequado (`pro`, `flash`, `flash-lite`) conforme a exigência de latência.
- **Responsividade** — teste em mobile (375px) e desktop; o painel lateral deve colapsar elegantemente.
- **Idioma** — toda a UI e os prompts ficam em português do Brasil.

## Fluxo de PR

1. Crie uma branch descritiva: `feat/controle-tempo-por-etapa`
2. Faça commits pequenos e claros (pt-BR ou inglês, mas consistentes)
3. Garanta que `bun run lint` passa sem erros
4. Descreva no PR: **o que muda**, **por quê** e **como testar**

## Reportando bugs

Abra uma issue com: passos para reproduzir, comportamento esperado vs. obtido
e screenshots quando aplicável. Se envolver resposta de IA, inclua o modo/motor
utilizado.

## Ideias prioritárias

Consulte o roadmap no [README](README.md#-roadmap). Issues marcadas com
`good first issue` são pontos de entrada recomendados.
