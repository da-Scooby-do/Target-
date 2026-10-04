import "server-only";

/** Forms filled in faster than this are almost always bots. */
export const MIN_FILL_MS = 3000;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

/**
 * Best-effort limit of submissions per IP. Memory is per server instance, so
 * this slows down abuse rather than stopping it; the honeypot and timing
 * checks catch most bots.
 */
export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export function looksLikeBot(honeypot: string | undefined, startedAt: number) {
  return Boolean(honeypot) || !Number.isFinite(startedAt);
}

export function tooFast(startedAt: number) {
  return Date.now() - startedAt < MIN_FILL_MS;
}
