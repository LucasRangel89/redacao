import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { acervo } from "@/lib/recursos";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico leve: informa ao cliente se há um provedor de IA realmente
 * utilizável. Sem isso a interface poderia exibir "IA online" mesmo quando o
 * provedor embutido não está configurado — o cliente cairia no modo local só
 * depois da primeira falha.
 */
let cache: { ate: number; disponivel: boolean; provedor: string } | null = null;

async function verificarProvedor(): Promise<{ disponivel: boolean; provedor: string }> {
  if (cache && cache.ate > Date.now()) {
    return { disponivel: cache.disponivel, provedor: cache.provedor };
  }
  let disponivel = false;
  let provedor = "indisponível";
  if (process.env.GEMINI_API_KEY) {
    disponivel = true;
    provedor = "Google Gemini (Pro/Flash/Flash-Lite)";
  } else {
    try {
      await ZAI.create();
      disponivel = true;
      provedor = "SDK embutido";
    } catch {
      disponivel = false;
      provedor = "nenhum (modo local)";
    }
  }
  cache = { ate: Date.now() + 5 * 60_000, disponivel, provedor };
  return { disponivel, provedor };
}

export async function GET() {
  const { disponivel, provedor } = await verificarProvedor();
  return NextResponse.json(
    {
      online: disponivel,
      iaDisponivel: disponivel,
      gemini: Boolean(process.env.GEMINI_API_KEY),
      provedor,
      acervo: {
        temas: acervo.totalTemas,
        redacoes: acervo.totalRedacoes,
        citacoes: acervo.totalCitacoes,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
