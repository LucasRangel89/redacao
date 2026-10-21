/**
 * Rate limiter em memória (sliding window por IP).
 *
 * Evita abuso das rotas de IA — cada chamada custa tokens/créditos.
 * Para produção com múltiplas instâncias, substituir por Redis.
 */
const WINDOWS = new Map<string, { hits: number; resetAt: number }>();

export interface RateLimitConfig {
  /** Máximo de requisições na janela */
  max: number;
  /** Duração da janela em segundos */
  windowSec: number;
}

export interface RateLimitInfo {
  ok: boolean;
  remaining: number;
  resetInSec: number;
}

export function rateLimit(
  identifier: string,
  { max, windowSec }: RateLimitConfig
): RateLimitInfo {
  const key = identifier;
  const now = Date.now();
  const win = WINDOWS.get(key);
  if (!win || now > win.resetAt) {
    WINDOWS.set(key, { hits: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: max - 1, resetInSec: windowSec };
  }
  if (win.hits >= max) {
    return {
      ok: false,
      remaining: 0,
      resetInSec: Math.ceil((win.resetAt - now) / 1000),
    };
  }
  win.hits += 1;
  return { ok: true, remaining: max - win.hits, resetInSec: Math.ceil((win.resetAt - now) / 1000) };
}

/** Extrai um identificador estável de uma Request (IP via headers ou fallback). */
export function clientIdentifier(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "anonymous";
}

/** Limpeza periódica da memória (a cada 5 min) */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of WINDOWS) {
      if (now > v.resetAt) WINDOWS.delete(k);
    }
  }, 5 * 60 * 1000).unref?.();
}
