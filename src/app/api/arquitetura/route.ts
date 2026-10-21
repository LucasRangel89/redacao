import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { ArquiteturaSugestao } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const SYSTEM = `Você é um professor sênior de redação ENEM com foco em metodologia de andaime (scaffolding).
Objetivo: ajudar o estudante a ARQUITETAR o texto ANTES de escrever — nunca escrever a redação por ele.

DIRETRIZES:
- Tese: 1 ou 2 frases, clara, delimitada e discutível, respondendo ao enunciado do tema.
- Argumentos (2 ou 3): cada um com
  - topicoFrasal: afirmação que encerra a discussão do parágrafo (quem/qué/por quê/efeito);
  - repertorio: específico e VERIFICÁVEL — cite autor/obra (filosofia, sociologia, literatura),
    dado estatístico com fonte institucional (IBGE, INEP, OMS, ONU), lei, caso histórico ou judicial.
    NUNCA use repertório genérico (\"como séculos na história da humanidade...\").
  - analise: 2-3 frases que conectam o repertório ao tópico frasal e ao tema (causa/consequência explícita).
- Não escreva parágrafos prontos: entregue peças de arquitetura.
- Responda APENAS com JSON válido.`;

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientIdentifier(req), { max: 6, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Muitas requisições. Tente novamente em ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { tema, teseAtual } = await validateBody(req, schemas.arquitetura);

    const user = `TEMA:\n"""${tema}"""\n${teseAtual ? `\nTese provisória do estudante (aprimore ou preserve a ideia central):\n"""${teseAtual}"""\n` : ""}Proponha uma arquitetura argumentativa completa (2 a 3 argumentos).\nResponda APENAS com JSON no formato:\n{\n  "tese": "1-2 frases",\n  "argumentos": [\n    { "topicoFrasal": "...", "repertorio": "...", "analise": "..." }\n  ],\n  "aviso": "observação curta sobre a lógica do plano escolhido (opcional)"\n}`;

    const raw = await chatComplete({
      system: SYSTEM,
      user,
      engine: "pro",
      json: true,
      temperature: 0.75,
    });

    const parsed = extractJson<ArquiteturaSugestao>(raw);
    if (!parsed?.tese || !parsed?.argumentos?.length) {
      return NextResponse.json(
        { error: "A IA não conseguiu estruturar o plano. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      tese: parsed.tese,
      argumentos: parsed.argumentos.slice(0, 3),
      aviso: parsed.aviso ?? undefined,
    });
  } catch (err) {
    console.error("[api/arquitetura]", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Falha ao gerar arquitetura. Tente novamente." },
      { status: 500 }
    );
  }
}
