export const prerender = false;
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || site || "https://diverpremier.com").toString().replace(/\/$/, "");
  const currentDate = new Date().toISOString().split("T")[0];

  const pages = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/productos", priority: "0.9", changefreq: "daily" },
    { path: "/mapa", priority: "0.8", changefreq: "weekly" },
    { path: "/cocteleria", priority: "0.8", changefreq: "weekly" },
    { path: "/nosotros", priority: "0.7", changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
};
