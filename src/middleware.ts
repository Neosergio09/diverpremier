import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";
import { checkRateLimit } from "./lib/rateLimiter";

const PROTECTED_ADMIN_APIS = [
  "/api/create-product",
  "/api/update-product",
  "/api/update-order",
  "/api/bulk-products",
  "/api/bulk-upload-images",
  "/api/upload-image",
];

function getClientIp(context: any): string {
  try {
    if (context.clientAddress) return context.clientAddress;
  } catch {
    // Silently ignore PrerenderClientAddressNotAvailable during static site generation
  }
  return (
    context.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    context.request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // 🛡️ 1. Rate Limiting para endpoints públicos sensibles (Mitigación de Abuso / DDoS)
  if (url.pathname === "/api/create-order") {
    const clientIp = getClientIp(context);
    const limit = checkRateLimit(`order:${clientIp}`, {
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10,                 // Máximo 10 pedidos cada 5 mins por IP
    });

    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Has superado el límite de creación de pedidos. Por favor espera ${limit.retryAfterSeconds} segundos.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfterSeconds),
          },
        }
      );
    }
  }

  if (url.pathname === "/api/report-payment") {
    const clientIp = getClientIp(context);
    const limit = checkRateLimit(`report:${clientIp}`, {
      windowMs: 5 * 60 * 1000,
      max: 15,
    });

    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Demasiados reportes de pago. Espera ${limit.retryAfterSeconds} segundos.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(limit.retryAfterSeconds),
          },
        }
      );
    }
  }

  // 🛡️ 2. Protección de Rutas Administrativas
  const isAdminPage = url.pathname.startsWith("/admin");
  const isAdminApi = PROTECTED_ADMIN_APIS.some((route) =>
    url.pathname.startsWith(route)
  );

  if (isAdminPage || isAdminApi) {
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    // Reject if no tokens are present
    if (!accessToken && !refreshToken) {
      if (isAdminApi) {
        return new Response(
          JSON.stringify({ error: "Acceso no autorizado al búnker administrativo." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return redirect("/login");
    }

    // Verify access token with Supabase
    let isValidSession = false;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data.user) {
        isValidSession = true;
      }
    }

    // Refresh using refresh_token if expired
    if (!isValidSession && refreshToken) {
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (!refreshError && refreshData.session) {
        isValidSession = true;
        // Set new refreshed tokens with HttpOnly
        cookies.set("sb-access-token", refreshData.session.access_token, {
          path: "/",
          maxAge: refreshData.session.expires_in,
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        });
        cookies.set("sb-refresh-token", refreshData.session.refresh_token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          sameSite: "lax",
          secure: true,
        });
      }
    }

    // If still invalid, purge cookies and deny access
    if (!isValidSession) {
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });

      if (isAdminApi) {
        return new Response(
          JSON.stringify({ error: "Sesión expirada o no autorizada." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return redirect("/login");
    }
  }

  // 🛡️ 3. Cabeceras de Seguridad Globales (OWASP Recommended)
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
});

