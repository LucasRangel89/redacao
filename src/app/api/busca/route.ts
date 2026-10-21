import { NextResponse } from "next/server";
import { chatComplete, extractJson, webSearch } from "@/lib/ai";
import type { BuscaResultado } from "@/lib/types";

export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const { query } = (await req.json()) as { query: string };

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Digite o que você quer pesquisar." },
        { status: 400 }
      );
    }

    // Busca fundamentada (grounded search) na web
    const resultados = await webSearch(query, 6, 365);

    const contexto = resultados
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.url}`)
      .join("\n\n");

    let sintese = "";
    let dados: { dado: string; fonte: string }[] = [];

    if (contexto) {
      try {
        const raw = await chatComplete({
          system: `Você é um assistente de checagem de fatos para estudantes de redação.
Com base nos RESULTADOS DE BUSCA, produza:
1) "sintese": 2-4 frases objetivas respondendo à pergunta, citando fontes entre parênteses;
2) "dados": até 4 dados/citações úteis para argumentação, cada um com sua fonte.
NÃO invente dados que não estejam nos resultados. Responda APENAS com JSON.`,
          user: `PERGUNTA: ${query}\n\nRESULTADOS DE BUSCA:\n${contexto}\n\nResponda APENAS com JSON:
{ "sintese": "...", "dados": [{ "dado": "...", "fonte": "...", }] }`,
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
    return NextResponse.json(
      { error: "Falha na busca. Tente novamente." },
      { status: 500 }
    );
  }
}
