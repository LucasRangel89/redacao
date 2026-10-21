import { NextResponse } from "next/server";
import { chatComplete, extractJson, webSearch } from "@/lib/ai";
import { HttpError, schemas, validateBody } from "@/lib/validation";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import type { Tema } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const SYSTEM = `Você é um elaborador de temas de redação brasileiros, especialista no formato ENEM e em vestibulares.
Sua tarefa: a partir de NOTÍCIAS E DEBATES REAIS E RECENTES do Brasil (fornecidos no contexto de busca), propor temas
dissertativo-argumentativos no estilo ENEM.

REGRAS:
- Cada tema deve partir de um debate social REAL e ATUAL da sociedade brasileira (educação, meio ambiente, tecnologia,
  saúde, cidadania, cultura, trabalho, economia etc.).
- O enunciado deve contextualizar brevemente o problema e terminar com a instrução clássica:
  "... apresente proposta de intervenção para o problema apresentado, respeitando os direitos humanos."
- Inclua 2 textos motivadores sintéticos por tema (tipo/fonte + resumo), como no ENEM (gráfico, notícia, citação).
- Nunca invente dados numéricos precisos nos motivadores; prefira descrições qualitativas.
- Responda APENAS com JSON válido, sem texto fora do JSON.`;

interface TemaRaw {
  titulo?: string;
  area?: string;
  textosMotivadores?: { fonte?: string; resumo?: string }[];
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 gerações de tema por minuto (evita esgotar cota)
    const rl = rateLimit(clientIdentifier(req), { max: 5, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Muitas requisições. Tente novamente em ${rl.resetInSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetInSec) } }
      );
    }

    const { area } = await validateBody(req, schemas.temas);
    const recorte = area && area !== "Geral" ? ` relacionados a "${area}"` : "";

    // Grounded search em paralelo: debates recentes + previsões de vestibular
    const [debates, exames] = await Promise.all([
      webSearch(
        `principais debates e problemas sociais Brasil atualidade 2025 2026${recorte}`,
        6,
        120
      ).catch(() => []),
      webSearch(
        `temas possíveis redação ENEM atualidades Brasil${recorte}`,
        5,
        365
      ).catch(() => []),
    ]);

    const contexto = [...debates, ...exames]
      .slice(0, 10)
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
      .join("\n\n");

    const user = `Contexto de busca atual (use como base realista):\n${contexto || "(busca indisponível, use seu conhecimento sobre debates brasileiros recentes)"}\n\nGere 6 temas de redação estilo ENEM${recorte || " sobre debates relevantes e atuais"}, variados entre si.\nFormato de resposta (JSON estrito):\n{\n  "temas": [\n    {\n      "titulo": "enunciado completo no estilo ENEM",\n      "area": "área temática",\n      "textosMotivadores": [\n        { "fonte": "ex.: Notícia — portal de jornalismo", "resumo": "1-2 frases" },\n        { "fonte": "ex.: Citação — pensador/instituição", "resumo": "1-2 frases" }\n      ]\n    }\n  ]\n}`;

    const raw = await chatComplete({
      system: SYSTEM,
      user,
      engine: "flash",
      json: true,
      temperature: 0.9,
    });

    const parsed = extractJson<{ temas?: TemaRaw[] }>(raw);
    const temas: Tema[] = (parsed?.temas ?? [])
      .filter((t) => t?.titulo)
      .map((t) => ({
        titulo: String(t.titulo).trim(),
        area: String(t.area ?? area ?? "Geral").trim(),
        textosMotivadores: (t.textosMotivadores ?? [])
          .filter((m) => m?.resumo)
          .map((m) => ({
            fonte: String(m.fonte ?? "Texto motivador").trim(),
            resumo: String(m.resumo).trim(),
          })),
      }));

    if (temas.length === 0) {
      return NextResponse.json(
        { error: "Não foi possível gerar temas agora. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({ temas });
  } catch (err) {
    console.error("[api/temas]", err);
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Falha ao gerar temas. Verifique a conexão e tente de novo." },
      { status: 500 }
    );
  }
}
