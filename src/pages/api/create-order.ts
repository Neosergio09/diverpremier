import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { ticket_id, total_price, items } = data;

    if (!ticket_id || !items) {
      return new Response(JSON.stringify({ error: "Faltan datos para crear el pedido en el búnker." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Insert into orders table
    const { data: newOrder, error } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          ticket_id,
          total_price: Number(total_price),
          items,
          status: "pending_payment"
        }
      ])
      .select()
      .single();

    if (error || !newOrder) {
      console.error("⚠️ Error creando pedido en el búnker:", error);
      return new Response(JSON.stringify({ 
        error: "Falla al crear orden.", 
        details: error?.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Insert into relational order_items table
    const rawItemsList = Array.isArray(items) ? items : Object.values(items);
    if (rawItemsList.length > 0) {
      // Find missing product UUIDs by looking up names in products table
      const namesToQuery = rawItemsList
        .filter((item: any) => !item.productId && item.name)
        .map((item: any) => item.name);

      const nameToIdMap = new Map<string, string>();

      if (namesToQuery.length > 0) {
        const { data: matchedProducts } = await supabaseAdmin
          .from("products")
          .select("id, name")
          .in("name", namesToQuery);

        matchedProducts?.forEach(p => {
          nameToIdMap.set(p.name.toLowerCase().trim(), p.id);
        });
      }

      const orderItemsToInsert = rawItemsList.map((item: any) => {
        let prodId = item.productId || (item.id && /^[0-9a-fA-F-]{36}$/.test(item.id) ? item.id : null);
        if (!prodId && item.name) {
          prodId = nameToIdMap.get(item.name.toLowerCase().trim());
        }

        return {
          order_id: newOrder.id,
          product_id: prodId || null,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.price) || 0,
        };
      });

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error("⚠️ Error al registrar items en order_items:", itemsError);
      } else {
        console.log(`✅ ${orderItemsToInsert.length} items registrados en order_items para ticket ${ticket_id}.`);
      }
    }

    return new Response(JSON.stringify({ 
        message: "Orden creada.",
        data: newOrder
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("💥 Error crítico en POST /api/create-order:", err);
    return new Response(JSON.stringify({ error: "Falla interna del búnker." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
