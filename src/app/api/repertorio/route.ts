import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { RepertorioSugestao } from "@/lib/types";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

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
    const rl = rateLimit(clientIdentifier(req), { max: 15, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Muitas requisições. Aguarde ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { tema, tipo } = await validateBody(req, schemas.repertorio);

    const user = `TEMA: """${tema}"""\nTIPO DE REPERTÓRIO: ${tipo}\n\nResponda APENAS com JSON:\n{\n  "sugestoes": [\n    {\n      "titulo": "nome do repertório (obra/autor, lei, instituição+tema)",\n      "fonte": "autoria ou instituição",\n      "ideiaCentral": "1-2 frases",\n      "comoUsar": "1 frase de aplicação argumentativa"\n    }\n  ]\n}`;

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
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Falha ao buscar repertórios. Tente novamente." },
      { status: 500 }
    );
  }
}
