/**
 * Camada de IA — Arquitetura de Modelos Híbrida
 *
 * Se a variável GEMINI_API_KEY estiver definida, as requisições são roteadas
 * para a API do Google Gemini (séries 3 Pro / 3 Flash / Flash-Lite).
 * Caso contrário, o app usa o SDK de IA embutido do ambiente (fallback),
 * garantindo que o projeto funcione out-of-the-box.
 *
 * Mapeamento de motores:
 *  - pro         → análise profunda (revisão completa, arquitetura) — maior latência
 *  - flash       → interação durante a escrita (chat, gramática, busca)
 *  - flash-lite  → sugestões rápidas (revisão rápida, repertório)
 *
 * ⚠️ Uso exclusivo no BACKEND (API routes).
 */
import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import type { Engine } from "@/lib/types";

const GEMINI_MODELS: Record<Engine, string> = {
  pro: process.env.GEMINI_MODEL_PRO ?? "gemini-3-pro-preview",
  flash: process.env.GEMINI_MODEL_FLASH ?? "gemini-3-flash",
  "flash-lite": process.env.GEMINI_MODEL_FLASH_LITE ?? "gemini-3-flash-lite",
};

export interface ChatOptions {
  system: string;
  user: string;
  engine?: Engine;
  /** Solicita resposta em JSON estrito (quando suportado pelo provedor) */
  json?: boolean;
  temperature?: number;
}

/** Extrai JSON de uma resposta de LLM (tolerante a cercas de código e texto extra). */
export function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  let text = raw.trim();

  // Remove cercas de código ```json ... ``` ou ``` ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) text = fence[1].trim();

  try {
    return JSON.parse(text) as T;
  } catch {
    /* tenta recortar o objeto/array */
  }

  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  const start =
    firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)
      ? firstArr
      : firstObj;
  if (start === -1) return null;
  const endObj = text.lastIndexOf("}");
  const endArr = text.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (end <= start) return null;

  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Chama a API do Google Gemini via REST (sem dependências extras). */
async function geminiComplete(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  const model = GEMINI_MODELS[opts.engine ?? "flash"];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Análises profundas podem levar mais tempo
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  if (!text) throw new Error("Gemini retornou resposta vazia.");
  return text;
}

/** Fallback: SDK de IA do ambiente. */
async function sdkComplete(opts: ChatOptions): Promise<string> {
  const zai = await ZAI.create();
  const engine = opts.engine ?? "flash";
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    thinking: { type: engine === "pro" ? "enabled" : "disabled" },
    temperature: opts.temperature ?? 0.7,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("O modelo de IA retornou resposta vazia.");
  return content;
}

/** Executa uma conclusão de chat usando a arquitetura híbrida. */
export async function chatComplete(opts: ChatOptions): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiComplete(opts);
    } catch (err) {
      console.error("[ai] Gemini falhou, usando fallback SDK:", err);
      return sdkComplete(opts);
    }
  }
  return sdkComplete(opts);
}

/** Busca fundamentada (grounded search) na web. */
export async function webSearch(
  query: string,
  num = 6,
  recencyDays = 180
): Promise<{ title: string; snippet: string; url: string }[]> {
  const zai = await ZAI.create();
  const results = (await zai.functions.invoke("web_search", {
    query,
    num,
    recency_days: recencyDays,
  })) as { title?: string; snippet?: string; url?: string }[];

  return (results ?? [])
    .filter((r) => r && (r.title || r.snippet))
    .map((r) => ({
      title: r.title ?? "(sem título)",
      snippet: r.snippet ?? "",
      url: r.url ?? "",
    }));
}
