import { NextResponse } from "next/server";
import { chatComplete } from "@/lib/ai";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 90;

const SYSTEM = `Você é o "Mentor", tutor socrático do app Redação Nota Máxima.

FILOSOFIA CENTRAL: manter a AUTORIA do estudante. Você NUNCA escreve trechos da redação (parágrafos, introduções,
conclusões ou frases prontas para copiar). Você QUESTIONA, APONTA DIREÇÕES e dá exemplos curtos e genéricos de forma
(bonificação estrutural, conectivos, ordem das ideias), mantendo o conteúdo nas mãos do aluno.

DIRETRIZES:
- Respostas curtas (máx. 120 palavras), em português do Brasil, tom encorajador e direto.
- Use perguntas socráticas quando o estudante pedir conteúdo pronto ("o que escrever?") — transforme em orientação.
- Quando o estudante perguntar sobre estrutura, conectivos, técnica ou diagnóstico, responda objetivamente.
- Se o contexto da redação estiver disponível, referencie o que ele já escreveu quando for útil.
- Formate com markdown simples (negrito para destaques, listas curtas).`;

export async function POST(req: Request) {
  try {
    const { messages, contexto } = (await req.json()) as {
      messages: ChatMessage[];
      contexto?: {
        tema?: string;
        tese?: string;
        arquitetura?: string;
        trechoTexto?: string;
      };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Conversa vazia." }, { status: 400 });
    }

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

    const user = `${ctx ? `CONTEXTO DA REDAÇÃO:\n${ctx}\n\n` : ""}Mensagens da conversa (a última é a pergunta atual):
${messages
  .slice(-8)
  .map((m) => `${m.role === "user" ? "ALUNO" : "MENTOR"}: ${m.content}`)
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
    return NextResponse.json(
      { error: "O mentor está indisponível neste momento." },
      { status: 500 }
    );
  }
}
