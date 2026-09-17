import type { APIRoute } from "astro";
import { supabaseAdmin, getSupabaseServiceKey } from "@lib/supabase";
import { invalidateCatalogCache } from "@lib/cache";

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    console.log("📦 Incoming update request for búnker:", data);
    
    const { id, name, price, stock_quantity, category_id, image_url } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: "Product ID is required for búnker sync." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceKey = getSupabaseServiceKey();
    if (!serviceKey) {
      console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY no detectada en el entorno. La operación podría ser rechazada por RLS.");
    }

    const updatePayload: Record<string, any> = {};

    if (name !== undefined) {
      updatePayload.name = String(name).trim();
    }

    if (price !== undefined && price !== "" && price !== null) {
      const numPrice = Number(price);
      if (!isNaN(numPrice)) {
        updatePayload.price = numPrice;
      }
    }

    if (stock_quantity !== undefined && stock_quantity !== "" && stock_quantity !== null) {
      const numStock = Number(stock_quantity);
      if (!isNaN(numStock)) {
        updatePayload.stock_quantity = Math.max(0, numStock);
      }
    }

    if (category_id !== undefined) {
      const trimmedCat = typeof category_id === "string" ? category_id.trim() : "";
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedCat);
      updatePayload.category_id = isUuid ? trimmedCat : null;
    }

    if (image_url !== undefined && image_url !== null) {
      updatePayload.image_url = image_url;
    }

    if (Object.keys(updatePayload).length === 0) {
      return new Response(JSON.stringify({ error: "No se proporcionaron campos válidos para actualizar." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 💣 Operación Segura: Con Service Role para bypass de RLS
    const { data: updatedProduct, error } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("⚠️ Error en el búnker de datos:", error);

      let helpfulMsg = error.message;
      if (error.code === "PGRST116") {
        helpfulMsg = "No se pudo actualizar el producto (0 filas afectadas). Esto ocurre si la variable SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno de Vercel o el ID no existe.";
      }

      return new Response(JSON.stringify({ 
        error: "Falla en la persistencia del búnker.", 
        details: helpfulMsg,
        code: error.code
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    invalidateCatalogCache();

    return new Response(JSON.stringify({ 
        message: "¡Búnker actualizado correctamente!",
        data: updatedProduct 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("💥 Error crítico en PATCH /api/update-product:", err);
    return new Response(JSON.stringify({ 
      error: "Falla interna del búnker. Revisa consola.",
      details: err?.message || String(err)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
