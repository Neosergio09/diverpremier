import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    console.log("📦 Incoming update request for búnker:", data);
    
    const { id, name, price, stock_quantity, category_id } = data;

    if (!id) {
      return new Response(JSON.stringify({ error: "Product ID is required for búnker sync." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 💣 Operación Segura: Sin updated_at y con Service Role
    const { data: updatedProduct, error } = await supabase
      .from("products")
      .update({
        name,
        price: Number(price),
        stock_quantity: Number(stock_quantity),
        category_id,
        // Eliminado updated_at según reporte de esquema
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("⚠️ Error en el búnker de datos:", error);
      return new Response(JSON.stringify({ 
        error: "Falla en la persistencia del búnker.", 
        details: error.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
        message: "¡Búnker actualizado correctamente!",
        data: updatedProduct 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("💥 Error crítico en PATCH /api/update-product:", err);
    return new Response(JSON.stringify({ error: "Falla interna del búnker. Revisa consola." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
