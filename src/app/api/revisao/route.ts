import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import type { ModoRevisao, RevisaoResultado } from "@/lib/types";

export const maxDuration = 180;

const BASE = `Você é um corretor oficial de redações ENEM. Avalie o texto do estudante com honestidade técnica e didática.
Seja específico: aponte trechos reais do texto, nunca genericidades. Responda APENAS com JSON válido.`;

const PROMPTS: Record<
  ModoRevisao,
  { engine: "flash-lite" | "flash" | "pro"; instrucao: string }
> = {
  rapida: {
    engine: "flash-lite",
    instrucao: `Modo RÁPIDO (leitura de superfície): entregue um resumo de 1-2 frases sobre o estado do texto,
3 pontos fortes e 3 melhorias prioritárias, todos curtos e acionáveis.`,
  },
  gramatical: {
    engine: "flash",
    instrucao: `Modo GRAMATICAL: varra o texto em busca de desvios da modalidade escrita formal
(Competência 1): ortografia, acentuação, concordância (verbal/nominal), regência, crase, pontuação, vírgulas
indevidas, colisão registral (linguagem coloquial) e erros de hifenização.
Para cada ocorrência, extraia o trecho ORIGINAL exatamente como escrito e apresente a CORREÇÃO + explicação de 1 frase.
Liste no máximo 10 correções, ordenadas por gravidade.`,
  },
  profunda: {
    engine: "pro",
    instrucao: `Modo PROFUNDO (correção completa estilo ENEM): avalie as 5 COMPETÊNCIAS com notas reais do
intervalo ENEM para cada uma (C1 domínio da norma; C2 compreensão da proposta e repertório produtivo;
C3 organização/argumentação; C4 mecanismos linguísticos/coesão; C5 proposta de intervenção com 5 elementos).
Atribua notas plausíveis do conjunto {0,40,80,120,160,200} com feedback específico por competência,
cite trechos, estime a nota total (0-1000) e finalize com próximos passos práticos.`,
  },
};

export async function POST(req: Request) {
  try {
    const { texto, modo, tema } = (await req.json()) as {
      texto: string;
      modo: ModoRevisao;
      tema?: string;
    };

    if (!texto?.trim()) {
      return NextResponse.json(
        { error: "Escreva ao menos um parágrafo antes de solicitar revisão." },
        { status: 400 }
      );
    }
    if (!modo || !PROMPTS[modo]) {
      return NextResponse.json({ error: "Modo de revisão inválido." }, { status: 400 });
    }

    const { engine, instrucao } = PROMPTS[modo];
    const user = `${instrucao}

TEMA DA PROPOSTA:
"""${tema?.trim() || "(não informado)"}"""

TEXTO DO ESTUDANTE:
"""${texto.slice(0, 8000)}"""

Formatos de resposta (JSON estrito):
- Modo RÁPIDO: { "resumo": "...", "pontosFortes": ["..."], "pontosMelhoria": ["..."] }
- Modo GRAMATICAL: { "resumo": "...", "correcoes": [{ "original": "trecho exato", "correcao": "...", "explicacao": "..." }] }
- Modo PROFUNDO: {
    "resumo": "...",
    "competencias": [
      { "codigo": "C1", "nome": "Domínio da norma culta", "nota": 160, "feedback": "..." },
      { "codigo": "C2", "nome": "Compreensão da proposta e repertório", "nota": 160, "feedback": "..." },
      { "codigo": "C3", "nome": "Organização e argumentação", "nota": 160, "feedback": "..." },
      { "codigo": "C4", "nome": "Coesão e mecanismos linguísticos", "nota": 160, "feedback": "..." },
      { "codigo": "C5", "nome": "Proposta de intervenção", "nota": 160, "feedback": "..." }
    ],
    "pontosFortes": ["..."],
    "pontosMelhoria": ["..."],
    "notaEstimada": 800,
    "proximosPassos": ["..."]
  }`;

    const raw = await chatComplete({
      system: BASE,
      user,
      engine,
      json: true,
      temperature: modo === "profunda" ? 0.4 : 0.6,
    });

    const parsed = extractJson<RevisaoResultado>(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "A IA não retornou uma análise válida. Tente novamente." },
        { status: 502 }
      );
    }

    // Sanitização das notas
    if (parsed.competencias) {
      parsed.competencias = parsed.competencias.map((c) => ({
        ...c,
        nota: Math.max(0, Math.min(200, Number(c.nota) || 0)),
      }));
    }
    if (parsed.notaEstimada !== undefined) {
      parsed.notaEstimada = Math.max(0, Math.min(1000, Number(parsed.notaEstimada) || 0));
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[api/revisao]", err);
    return NextResponse.json(
      { error: "Falha ao revisar o texto. Tente novamente." },
      { status: 500 }
    );
  }
}
