import { defineMiddleware } from "astro:middleware";
import { supabase } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Protect all /admin routes
  if (url.pathname.startsWith("/admin")) {
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken && !refreshToken) {
      return redirect("/login");
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      // Clear invalid cookies
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });
      return redirect("/login");
    }
  }

  return next();
});
