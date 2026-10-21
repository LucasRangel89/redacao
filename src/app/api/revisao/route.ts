import { NextResponse } from "next/server";
import { chatComplete, extractJson } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { ModoRevisao, RevisaoResultado } from "@/lib/types";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

const BASE = `Você é um corretor oficial de redações ENEM. Avalie o texto do estudante com honestidade técnica e didática.
Seja específico: aponte trechos reais do texto, nunca genericidades. Responda APENAS com JSON válido.`;

const PROMPTS: Record<
  ModoRevisao,
  { engine: "flash-lite" | "flash" | "pro"; instrucao: string }
> = {
  rapida: {
    engine: "flash-lite",
    instrucao: `Modo RÁPIDO (leitura de superfície): entregue um resumo de 1-2 frases sobre o estado do texto,\n3 pontos fortes e 3 melhorias prioritárias, todos curtos e acionáveis.`,
  },
  gramatical: {
    engine: "flash",
    instrucao: `Modo GRAMATICAL: varra o texto em busca de desvios da modalidade escrita formal\n(Competência 1): ortografia, acentuação, concordância (verbal/nominal), regência, crase, pontuação, vírgulas\nindevidas, colisão registral (linguagem coloquial) e erros de hifenização.\nPara cada ocorrência, extraia o trecho ORIGINAL exatamente como escrito e apresente a CORREÇÃO + explicação de 1 frase.\nListe no máximo 10 correções, ordenadas por gravidade.`,
  },
  profunda: {
    engine: "pro",
    instrucao: `Modo PROFUNDO (correção completa estilo ENEM): avalie as 5 COMPETÊNCIAS com notas reais do\nintervalo ENEM para cada uma (C1 domínio da norma; C2 compreensão da proposta e repertório produtivo;\nC3 organização/argumentação; C4 mecanismos linguísticos/coesão; C5 proposta de intervenção com 5 elementos).\nAtribua notas plausíveis do conjunto {0,40,80,120,160,200} com feedback específico por competência,\ncite trechos, estime a nota total (0-1000) e finalize com próximos passos práticos.`,
  },
};

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientIdentifier(req), { max: 4, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Revisão profunda é custosa. Aguarde ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { texto, modo, tema } = await validateBody(req, schemas.revisao);
    const { engine, instrucao } = PROMPTS[modo];

    const user = `${instrucao}\n\nTEMA DA PROPOSTA:\n"""${tema || "(não informado)"}"""\n\nTEXTO DO ESTUDANTE:\n"""${texto.slice(0, 12000)}"""\n\nFormatos de resposta (JSON estrito):\n- Modo RÁPIDO: { "resumo": "...", "pontosFortes": ["..."], "pontosMelhoria": ["..."] }\n- Modo GRAMATICAL: { "resumo": "...", "correcoes": [{ "original": "trecho exato", "correcao": "...", "explicacao": "..." }] }\n- Modo PROFUNDO: {\n    "resumo": "...",\n    "competencias": [\n      { "codigo": "C1", "nome": "Domínio da norma culta", "nota": 160, "feedback": "..." },\n      { "codigo": "C2", "nome": "Compreensão da proposta e repertório", "nota": 160, "feedback": "..." },\n      { "codigo": "C3", "nome": "Organização e argumentação", "nota": 160, "feedback": "..." },\n      { "codigo": "C4", "nome": "Coesão e mecanismos linguísticos", "nota": 160, "feedback": "..." },\n      { "codigo": "C5", "nome": "Proposta de intervenção", "nota": 160, "feedback": "..." }\n    ],\n    "pontosFortes": ["..."],\n    "pontosMelhoria": ["..."],\n    "notaEstimada": 800,\n    "proximosPassos": ["..."]\n  }`;

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

    // Sanitização defensiva
    if (parsed.competencias) {
      parsed.competencias = parsed.competencias.map((c) => ({
        ...c,
        nota: Math.max(0, Math.min(200, Number(c.nota) || 0)),
      }));
    }
    if (parsed.notaEstimada !== undefined) {
      parsed.notaEstimada = Math.max(0, Math.min(1000, Number(parsed.notaEstimada) || 0));
    }
    parsed.pontosFortes ??= [];
    parsed.pontosMelhoria ??= [];
    parsed.proximosPassos ??= [];
    parsed.correcoes ??= [];

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[api/revisao]", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Falha ao revisar o texto. Tente novamente." },
      { status: 500 }
    );
  }
}
