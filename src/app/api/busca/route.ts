import { NextResponse } from "next/server";
import { chatComplete, extractJson, webSearch } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { BuscaResultado } from "@/lib/types";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientIdentifier(req), { max: 10, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Muitas buscas. Aguarde ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { query } = await validateBody(req, schemas.busca);

    const resultados = await webSearch(query, 6, 365);

    const contexto = resultados
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.url}`)
      .join("\n\n");

    let sintese = "";
    let dados: { dado: string; fonte: string }[] = [];

    if (contexto) {
      try {
        const raw = await chatComplete({
          system: `Você é um assistente de checagem de fatos para estudantes de redação.\nCom base nos RESULTADOS DE BUSCA, produza:\n1) "sintese": 2-4 frases objetivas respondendo à pergunta, citando fontes entre parênteses;\n2) "dados": até 4 dados/citações úteis para argumentação, cada um com sua fonte.\nNÃO invente dados que não estejam nos resultados. Responda APENAS com JSON.`,
          user: `PERGUNTA: ${query}\n\nRESULTADOS DE BUSCA:\n${contexto}\n\nResponda APENAS com JSON:\n{ "sintese": "...", "dados": [{ "dado": "...", "fonte": "..." }] }`,
          engine: "flash-lite",
          json: true,
          temperature: 0.3,
        });
        const parsed = extractJson<BuscaResultado>(raw);
        sintese = parsed?.sintese ?? "";
        dados = (parsed?.dados ?? [])
          .filter((d) => d?.dado)
          .map((d) => ({ dado: d.dado, fonte: d.fonte ?? "" }));
      } catch (e) {
        console.error("[api/busca] síntese falhou, seguindo sem ela:", e);
      }
    }

    return NextResponse.json({
      sintese,
      dados,
      resultados: resultados.slice(0, 6),
    });
  } catch (err) {
    console.error("[api/busca]", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Falha na busca. Tente novamente." },
      { status: 500 }
    );
  }
}
