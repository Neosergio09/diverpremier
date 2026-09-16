export const prerender = false;
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  return new Response(
    JSON.stringify({ success: true, message: "Sesión cerrada correctamente." }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
