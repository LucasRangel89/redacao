import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import type { RepertorioSugestao } from "@/lib/types";

export const maxDuration = 90;

const SYSTEM = `Você é um consultor de repertórios socioculturais para redações ENEM/Concursos.
Dado um tema e um TIPO de repertório, proponha 3 repertórios PRODUTIVOS (específicos, verificáveis e discutíveis),
evitando clichês (ex.: "sentido de vida" de Viktor Frankl repetido mecanicamente, filósofos mal citados).

REGRAS:
- Filosófico/Sociológico: cite autor + obra e a ideia aplicável ao tema.
- Dados: use instituições reais (IBGE, INEP, DataFolha, OMS, ONU, IPEA) e descreva a tendência sem inventar números
  precisos; quando houver, indique "dado amplamente divulgado" ou a ordem de grandeza aproximada com "≈".
- Histórico: casos e marcos verificáveis com ano aproximado.
- Legal: indique Constituição, lei, política pública ou documento internacional pertinentes.
- Cultural: obras literárias, filmes, séries ou músicas com autoria correta.
- "comoUsar": 1 frase ensinando a aplicar o repertório como base argumentativa (não escreva o parágrafo pronto).
- Responda APENAS com JSON válido.`;

export async function POST(req: Request) {
  try {
    const { tema, tipo } = (await req.json()) as {
      tema: string;
      tipo: string;
    };

    if (!tema?.trim() || !tipo) {
      return NextResponse.json(
        { error: "Informe tema e tipo de repertório." },
        { status: 400 }
      );
    }

    const user = `TEMA: """${tema}"""
TIPO DE REPERTÓRIO: ${tipo}

Responda APENAS com JSON:
{
  "sugestoes": [
    {
      "titulo": "nome do repertório (obra/autor, lei, instituição+tema)",
      "fonte": "autoria ou instituição",
      "ideiaCentral": "1-2 frases",
      "comoUsar": "1 frase de aplicação argumentativa"
    }
  ]
}`;

    const raw = await chatComplete({
      system: SYSTEM,
      user,
      engine: "flash-lite",
      json: true,
      temperature: 0.8,
    });

    const parsed = extractJson<{ sugestoes?: RepertorioSugestao[] }>(raw);
    const sugestoes = (parsed?.sugestoes ?? []).filter((s) => s?.titulo);

    if (sugestoes.length === 0) {
      return NextResponse.json(
        { error: "Sem sugestões no momento. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({ sugestoes: sugestoes.slice(0, 4) });
  } catch (err) {
    console.error("[api/repertorio]", err);
    return NextResponse.json(
      { error: "Falha ao buscar repertórios. Tente novamente." },
      { status: 500 }
    );
  }
}
