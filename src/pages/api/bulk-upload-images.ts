export const prerender = false;
import type { APIRoute } from "astro";
import { supabaseAdmin, processToWebp, sanitizeFilename } from "../../lib/imageProcessor";
import { findBestProductMatch } from "../../lib/matcher";
import { invalidateCatalogCache } from "../../lib/cache";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Content-Type debe ser multipart/form-data." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se recibieron archivos para procesar." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Obtener catálogo actual de productos
    const { data: dbProducts, error: dbErr } = await supabaseAdmin
      .from("products")
      .select("id, name");

    if (dbErr || !dbProducts) {
      return new Response(
        JSON.stringify({ error: "Error consultando los productos del búnker.", details: dbErr?.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const matchedList: any[] = [];
    const unmatchedList: string[] = [];

    // 2. Procesar cada archivo en paralelo o serie controlada
    for (const file of files) {
      if (!(file instanceof File) || file.size === 0) continue;

      const match = findBestProductMatch(file.name, dbProducts);
      if (!match) {
        unmatchedList.push(file.name);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const processed = await processToWebp(arrayBuffer);

        const baseName = sanitizeFilename(match.productName);
        const storagePath = `products/${baseName}.webp`;

        // Subir a Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from("diverpremier-assets")
          .upload(storagePath, processed.buffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Error subiendo imagen para ${match.productName}:`, uploadError);
          unmatchedList.push(`${file.name} (Error Storage)`);
          continue;
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("diverpremier-assets")
          .getPublicUrl(storagePath);

        // Actualizar en base de datos
        const { error: updError } = await supabaseAdmin
          .from("products")
          .update({ image_url: publicUrl })
          .eq("id", match.productId);

        if (updError) {
          console.error(`Error actualizando producto ${match.productName}:`, updError);
          unmatchedList.push(`${file.name} (Error DB)`);
          continue;
        }

        matchedList.push({
          file: file.name,
          product: match.productName,
          imageUrl: publicUrl,
          score: Math.round(match.score * 100),
        });
      } catch (fileErr: any) {
        console.error(`Falla procesando archivo ${file.name}:`, fileErr);
        unmatchedList.push(`${file.name} (${fileErr.message || 'Error Sharp'})`);
      }
    }

    if (matchedList.length > 0) {
      invalidateCatalogCache();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización masiva completada: ${matchedList.length} imágenes procesadas a .webp y vinculadas.`,
        totalProcessed: files.length,
        matchedCount: matchedList.length,
        unmatchedCount: unmatchedList.length,
        matched: matchedList,
        unmatched: unmatchedList,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error crítico en POST /api/bulk-upload-images:", err);
    return new Response(
      JSON.stringify({ error: "Falla interna en la sincronización masiva.", details: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
