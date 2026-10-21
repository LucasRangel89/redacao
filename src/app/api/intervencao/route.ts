import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import type { IntervencaoSugestao } from "@/lib/types";

export const maxDuration = 90;

const SYSTEM = `Você é um professor de redação ENEM especialista na Competência 5 (proposta de intervenção).
Dado o tema/problema, elabore os 5 ELEMENTOS obrigatórios:
1. Agente — quem realizará a ação (poder público, sociedade civil, instituições...). Deve ser plausível.
2. Ação — o que o agente fará (verbo no infinitivo ou conjugado).
3. Meio/Modo — como fará (instrumento, caminho: campanha, lei, programa, parceria...).
4. Finalidade — para que fazer (o efeito esperado no problema).
5. Detalhamento — um detalhamento/encadeamento que complementa um dos elementos anteriores.

REGRAS:
- Respeite os direitos humanos (propostas que violam = nota 0 na C5).
- Seja específico ao tema; evite proposições genéricas.
- NÃO escreva o parágrafo final pronto: entregue os elementos + um "esqueletoParagrafo" com lacunas
  (ex.: "[Agente], ao [Ação], por meio de [Meio], com o objetivo de [Finalidade]...") para o estudante preencher
  com as próprias palavras.
- Responda APENAS com JSON válido.`;

export async function POST(req: Request) {
  try {
    const { tema, problema } = (await req.json()) as {
      tema: string;
      problema?: string;
    };

    if (!tema?.trim()) {
      return NextResponse.json(
        { error: "Informe o tema antes de solicitar a proposta." },
        { status: 400 }
      );
    }

    const user = `TEMA: """${tema}"""
${problema?.trim() ? `FOCO DO PROBLEMA (análise do estudante): """${problema}"""\n` : ""}
Responda APENAS com JSON:
{
  "agente": "...",
  "acao": "...",
  "meio": "...",
  "finalidade": "...",
  "detalhamento": "...",
  "esqueletoParagrafo": "modelo com lacunas [ ] para o estudante completar"
}`;

    const raw = await chatComplete({
      system: SYSTEM,
      user,
      engine: "flash",
      json: true,
      temperature: 0.7,
    });

    const parsed = extractJson<IntervencaoSugestao>(raw);
    if (!parsed?.agente) {
      return NextResponse.json(
        { error: "A IA não conseguiu propor a intervenção. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      agente: parsed.agente ?? "",
      acao: parsed.acao ?? "",
      meio: parsed.meio ?? "",
      finalidade: parsed.finalidade ?? "",
      detalhamento: parsed.detalhamento ?? "",
      esqueletoParagrafo: parsed.esqueletoParagrafo ?? "",
    });
  } catch (err) {
    console.error("[api/intervencao]", err);
    return NextResponse.json(
      { error: "Falha ao gerar proposta de intervenção." },
      { status: 500 }
    );
  }
}
