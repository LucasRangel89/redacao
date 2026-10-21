import { NextResponse } from "next/server";
import { chatComplete } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

const SYSTEM = `Você é o "Mentor", tutor socrático do app Redação Nota Máxima.\n\nFILOSOFIA CENTRAL: manter a AUTORIA do estudante. Você NUNCA escreve trechos da redação (parágrafos, introduções,\nconclusões ou frases prontas para copiar). Você QUESTIONA, APONTA DIREÇÕES e dá exemplos curtos e genéricos de forma\n(bonificação estrutural, conectivos, ordem das ideias), mantendo o conteúdo nas mãos do aluno.\n\nDIRETRIZES:\n- Respostas curtas (máx. 150 palavras), em português do Brasil, tom encorajador e direto.\n- Use perguntas socráticas quando o estudante pedir conteúdo pronto ("o que escrever?") — transforme em orientação.\n- Quando o estudante perguntar sobre estrutura, conectivos, técnica ou diagnóstico, responda objetivamente.\n- Se o contexto da redação estiver disponível, referencie o que ele já escreveu quando for útil.\n- Formate com markdown simples (negrito para destaques, listas curtas).`;

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientIdentifier(req), { max: 20, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Muitas mensagens. Aguarde ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { messages, contexto } = await validateBody(req, schemas.chat);

    const c = contexto ?? {};
    const ctx = [
      c.tema ? `TEMA: """${c.tema.slice(0, 600)}"""` : "",
      c.tese ? `TESE DO ALUNO: """${c.tese.slice(0, 400)}"""` : "",
      c.arquitetura ? `ARQUITETURA PLANEJADA: ${c.arquitetura.slice(0, 900)}` : "",
      c.trechoTexto
        ? `INÍCIO DO TEXTO ATUAL: """${c.trechoTexto.slice(0, 1200)}"""`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const recent = messages.slice(-10);
    const user = `${ctx ? `CONTEXTO DA REDAÇÃO:\n${ctx}\n\n` : ""}Mensagens da conversa (a última é a pergunta atual):\n${recent
      .map((m: ChatMessage) => `${m.role === "user" ? "ALUNO" : "MENTOR"}: ${m.content}`)
      .join("\n")}`;

    const raw = await chatComplete({
      system: SYSTEM,
      user,
      engine: "flash",
      temperature: 0.8,
    });

    return NextResponse.json({ resposta: raw.trim() });
  } catch (err) {
    console.error("[api/chat]", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "O mentor está indisponível neste momento." },
      { status: 500 }
    );
  }
}
