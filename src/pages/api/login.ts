export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabase";
import { checkRateLimit } from "@lib/rateLimiter";

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    // 🛡️ 1. Extracción de IP para protección de Fuerza Bruta
    const clientIp =
      clientAddress ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Máximo 5 intentos por cada 2 minutos por IP
    const rateLimit = checkRateLimit(`login:${clientIp}`, {
      windowMs: 2 * 60 * 1000,
      max: 5,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Demasiados intentos fallidos. Por seguridad, espera ${rateLimit.retryAfterSeconds} segundos antes de reintentar.`,
          retryAfter: rateLimit.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Credenciales incompletas." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔐 2. Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });

    if (error || !data.session) {
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas. Acceso denegado." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🍪 3. Emisión de Cookies Seguras HttpOnly (Invisibles a JavaScript / Inmunes a XSS)
    cookies.set("sb-access-token", data.session.access_token, {
      path: "/",
      maxAge: data.session.expires_in,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    cookies.set("sb-refresh-token", data.session.refresh_token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Acceso concedido al búnker.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Error en POST /api/login:", err);
    return new Response(
      JSON.stringify({ error: "Error interno en el servidor de autenticación." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
