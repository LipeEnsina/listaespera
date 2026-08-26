import { z } from "zod";

/** Mantém só os dígitos — usado tanto no input quanto na validação. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

/**
 * Formata progressivamente no padrão brasileiro:
 * (11) 91234-5678  /  (71) 3232-1010
 */
export function formatPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** DDDs válidos no Brasil (a ANATEL não usa todos os números de 11 a 99). */
const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function isValidPhoneBR(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 10 && d.length !== 11) return false;
  if (!VALID_DDD.has(Number(d.slice(0, 2)))) return false;
  // Celular (11 dígitos) sempre começa com 9 depois do DDD.
  if (d.length === 11 && d[2] !== "9") return false;
  // Fixo (10 dígitos) começa entre 2 e 5.
  if (d.length === 10 && !"2345".includes(d[2])) return false;
  // Rejeita sequências repetidas do tipo (11) 99999-9999.
  if (/^(\d)\1+$/.test(d.slice(2))) return false;
  return true;
}

export const waitlistSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Digite seu nome completo.")
    .max(80, "Nome muito longo.")
    .refine((v) => v.includes(" "), "Digite seu nome e sobrenome.")
    .refine((v) => /[\p{L}]/u.test(v), "Digite um nome válido."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "Digite seu e-mail.")
    .max(120, "E-mail muito longo.")
    .email("E-mail inválido.")
    .refine(
      (v) => !/(^|@)(exemplo|example|teste|test)\.(com|com\.br)$/i.test(v),
      "Use um e-mail real — é por ele que o convite chega.",
    ),
  telefone: z
    .string()
    .trim()
    .min(1, "Digite seu WhatsApp.")
    .refine(isValidPhoneBR, "Telefone inválido. Use DDD + número."),
  objetivo: z
    .string()
    .trim()
    .max(400, "Máximo de 400 caracteres.")
    .optional()
    .or(z.literal("")),
  consentimento: z.literal(true, {
    message: "Você precisa aceitar para entrar na lista.",
  }),
  origem: z.string().trim().max(120).optional().or(z.literal("")),
  // Honeypot: campo invisível que só um bot preenche.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

/** Erros no formato { campo: mensagem } para o formulário consumir. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
