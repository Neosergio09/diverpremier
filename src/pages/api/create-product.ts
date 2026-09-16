export const prerender = false;
import type { APIRoute } from "astro";
import { supabaseAdmin } from "@lib/supabase";
import { invalidateCatalogCache } from "@lib/cache";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    console.log("📦 Nuevo producto para el búnker:", data);

    const { name, price, stock_quantity, category_id, image_url, description } = data;

    if (!name || price === undefined || stock_quantity === undefined) {
      return new Response(
        JSON.stringify({ error: "Nombre, precio y stock son campos obligatorios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const newProductPayload: Record<string, any> = {
      name: String(name).trim(),
      price: Number(price),
      stock_quantity: Number(stock_quantity),
      category_id: category_id || null,
      is_active: true,
    };

    if (image_url) {
      newProductPayload.image_url = image_url;
    }

    if (description) {
      newProductPayload.description = String(description).trim();
    }

    const { data: createdProduct, error } = await supabaseAdmin
      .from("products")
      .insert([newProductPayload])
      .select()
      .single();

    if (error) {
      console.error("⚠️ Error insertando producto en el búnker:", error);
      return new Response(
        JSON.stringify({ error: "Falla al crear el producto en la base de datos.", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    invalidateCatalogCache();

    return new Response(
      JSON.stringify({
        message: "¡Producto añadido exitosamente al búnker!",
        data: createdProduct,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Error crítico en POST /api/create-product:", err);
    return new Response(
      JSON.stringify({ error: "Falla interna del servidor.", details: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
