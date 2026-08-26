/**
 * Rate limit simples, em memória, por IP.
 *
 * Limitação conhecida: em serverless (Vercel) cada instância tem a própria
 * memória, então o limite é "melhor esforço" — segura rajadas de um mesmo
 * cliente, mas não é uma barreira distribuída. Para algo mais forte, trocar
 * por Upstash Redis. Combinado com o honeypot e o índice único de e-mail,
 * é suficiente para uma lista de espera.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };

  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Poda preguiçosa para o Map não crescer sem limite.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
      if (buckets.size <= MAX_KEYS / 2) break;
    }
  }

  return { ok: true, retryAfterSeconds: 0 };
}

/** IP do visitante atrás do proxy da Vercel/Cloudflare. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
