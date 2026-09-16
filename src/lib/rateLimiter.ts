/**
 * Diverpremier Go - Sliding Window In-Memory Rate Limiter
 * Protege contra abusos, ataques DDoS de capa 7 y fuerza bruta.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpieza periódica de claves expiradas cada 5 minutos
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export interface RateLimitOptions {
  windowMs: number; // Ventana de tiempo en milisegundos
  max: number;      // Número máximo de peticiones permitidas en esa ventana
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Verifica si una clave (normalmente IP + ruta) supera el límite permitido.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.max - 1,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    retryAfterSeconds: 0,
  };
}
