/**
 * Sessão do painel admin: cookie httpOnly assinado com HMAC-SHA256.
 *
 * Usa Web Crypto (globalThis.crypto.subtle) em vez de node:crypto porque o
 * middleware do Next roda no runtime Edge, onde node:crypto não existe.
 */

export const SESSION_COOKIE = "lipe_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 horas

type Payload = { u: string; exp: number };

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error(
      "ADMIN_SESSION_SECRET ausente ou curto demais (mínimo 24 caracteres). Gere um com: openssl rand -base64 32",
    );
  }
  return secret;
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return new Uint8Array(sig);
}

/** Comparação em tempo constante — evita vazar o segredo por timing. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  const payload: Payload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<Payload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  try {
    const expected = await hmac(body);
    if (!timingSafeEqual(b64urlDecode(sig), expected)) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body)),
    ) as Payload;

    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Confere usuário e senha do .env sem vazar qual dos dois errou. */
export async function checkCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new Error(
      "ADMIN_USERNAME e ADMIN_PASSWORD precisam estar definidos no .env.local",
    );
  }

  const enc = new TextEncoder();
  // Compara os hashes para que a comparação seja de tamanho fixo.
  const [gotU, gotP, expU, expP] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(username)),
    crypto.subtle.digest("SHA-256", enc.encode(password)),
    crypto.subtle.digest("SHA-256", enc.encode(expectedUser)),
    crypto.subtle.digest("SHA-256", enc.encode(expectedPass)),
  ]);

  const userOk = timingSafeEqual(new Uint8Array(gotU), new Uint8Array(expU));
  const passOk = timingSafeEqual(new Uint8Array(gotP), new Uint8Array(expP));
  return userOk && passOk;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
