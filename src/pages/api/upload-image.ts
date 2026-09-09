export const prerender = false;
import type { APIRoute } from "astro";
import { uploadProductImageToStorage } from "../../lib/imageProcessor";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;
    let filename = `product_${Date.now()}`;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customName = formData.get("name") as string | null;

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No se proporcionó ningún archivo de imagen válido." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      filename = customName || file.name.replace(/\.[^/.]+$/, "") || filename;
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const data = await request.json();
      const { imageBase64, name } = data;
      if (!imageBase64) {
        return new Response(
          JSON.stringify({ error: "Campo imageBase64 requerido." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (name) filename = name;
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(cleanBase64, "base64");
    } else {
      return new Response(
        JSON.stringify({ error: "Content-Type no soportado. Usa multipart/form-data o application/json." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ⚡ Procesamiento garantizado a WebP y subida a Supabase Storage
    const publicUrl = await uploadProductImageToStorage(buffer, filename);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Imagen procesada y convertida a .webp con éxito.",
        imageUrl: publicUrl,
        format: "webp",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Error en POST /api/upload-image:", err);
    return new Response(
      JSON.stringify({
        error: "Falla al procesar y subir imagen a .webp.",
        details: err?.message || String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
