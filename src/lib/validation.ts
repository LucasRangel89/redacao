/**
 * Schemas de validação (Zod) para todas as rotas de API.
 *
 * Usamos esta camada para:
 *  1. Garantir tipagem segura antes de passar dados à IA.
 *  2. Bloquear inputs absurdamente longos (economia de tokens / segurança).
 *  3. Mensagens de erro claras para o client.
 */
import { z } from "zod";

const TEXTO_NAO_VAZIO = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(8000, "Texto muito longo (máx. 8.000 caracteres).");

const TEMA = z
  .string()
  .trim()
  .min(5, "Informe um tema válido (mín. 5 caracteres).")
  .max(800, "Tema muito longo.");

export const schemas = {
  temas: z.object({
    area: z
      .string()
      .trim()
      .max(60)
      .optional()
      .default("Geral"),
  }),

  arquitetura: z.object({
    tema: TEMA,
    teseAtual: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default(""),
  }),

  repertorio: z.object({
    tema: TEMA,
    tipo: z
      .string()
      .trim()
      .min(1)
      .max(30),
  }),

  intervencao: z.object({
    tema: TEMA,
    problema: z
      .string()
      .trim()
      .max(1500)
      .optional()
      .default(""),
  }),

  revisao: z.object({
    texto: TEXTO_NAO_VAZIO.max(
      12000,
      "Texto muito longo para revisão (máx. 12.000 caracteres)."
    ),
    modo: z.enum(["rapida", "gramatical", "profunda"]),
    tema: z.string().trim().max(800).optional().default(""),
  }),

  chat: z.object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(4000),
        })
      )
      .min(1, "Conversa vazia.")
      .max(30, "Histórico muito longo."),
    contexto: z
      .object({
        tema: z.string().max(800).optional(),
        tese: z.string().max(800).optional(),
        arquitetura: z.string().max(2000).optional(),
        trechoTexto: z.string().max(2000).optional(),
      })
      .optional()
      .default({}),
  }),

  busca: z.object({
    query: z
      .string()
      .trim()
      .min(2, "Digite ao menos 2 caracteres para pesquisar.")
      .max(200, "Consulta muito longa."),
  }),
} as const;

/** Valida o body JSON de uma request com um schema Zod; retorna dados tipados ou lança erro HTTP. */
export async function validateBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "JSON inválido no corpo da requisição.");
  }
  const result = await schema.safeParseAsync(raw);
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? "Dados inválidos.";
    throw new HttpError(400, msg);
  }
  return result.data;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}
