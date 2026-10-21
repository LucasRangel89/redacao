import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import type { ArquiteturaSugestao } from "@/lib/types";

export const maxDuration = 120;

const SYSTEM = `Você é um professor sênior de redação ENEM com foco em metodologia de andaime (scaffolding).
Objetivo: ajudar o estudante a ARQUITETAR o texto ANTES de escrever — nunca escrever a redação por ele.

DIRETRIZES:
- Tese: 1 ou 2 frases, clara, delimitada e discutível, respondendo ao enunciado do tema.
- Argumentos (2): cada um com
  - topicoFrasal: afirmação que encerra a discussão do parágrafo (quem/qué/por quê/efeito);
  - repertorio: específico e VERIFICÁVEL — cite autor/obra (filosofia, sociologia, literatura),
    dado estatístico com fonte institucional (IBGE, INEP, OMS, ONU), lei, caso histórico ou judicial.
    NUNCA use repertório genérico ("como séculos na história da humanidade...").
  - analise: 2-3 frases que conectam o repertório ao tópico frasal e ao tema (explicitar causa/consequência).
- Não escreva parágrafos prontos: entregue peças de arquitetura.
- Responda APENAS com JSON válido.`;

export async function POST(req: Request) {
  try {
    const { tema, teseAtual } = (await req.json()) as {
      tema: string;
      teseAtual?: string;
    };

    if (!tema?.trim()) {
      return NextResponse.json(
        { error: "Informe o tema antes de pedir sugestões de arquitetura." },
        { status: 400 }
      );
    }

    const user = `TEMA:
"""${tema}"""
${teseAtual?.trim() ? `\nTese provisória do estudante (aprimore ou preserve a ideia central):\n"""${teseAtual}"""\n` : ""}
Proponha uma arquitetura argumentativa completa.
Responda APENAS com JSON no formato:
{
  "tese": "1-2 frases",
  "argumentos": [
    {
      "topicoFrasal": "...",
      "repertorio": "...",
      "analise": "..."
    },
    { ... }
  ],
  "aviso": "observação curta sobre a lógica do plano escolhido (opcional)"
}`;

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
    return NextResponse.json(
      { error: "Falha ao gerar arquitetura. Tente novamente." },
      { status: 500 }
    );
  }
}
