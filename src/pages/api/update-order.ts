import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase";
import { invalidateCatalogCache } from "../../lib/cache";

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { ticket_id, status, delivery_driver, driver_phone, notes } = data;

    if (!ticket_id) {
      return new Response(JSON.stringify({ error: "Ticket ID es requerido para actualizar el pedido." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Fetch current order to check previous status and get its details
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, items")
      .eq("ticket_id", ticket_id)
      .single();

    if (fetchErr || !currentOrder) {
      console.error("⚠️ Orden no encontrada:", fetchErr);
      return new Response(JSON.stringify({ 
        error: "Orden no encontrada en el búnker.", 
        details: fetchErr?.message 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const previousStatus = currentOrder.status;
    const targetStatus = status || previousStatus;

    // Prepare updated items._delivery
    const existingItems = (typeof currentOrder.items === "object" && currentOrder.items) || {};
    const existingDelivery = existingItems._delivery || {};

    const updatedDelivery = {
      ...existingDelivery,
      ...(delivery_driver !== undefined ? { delivery_driver } : {}),
      ...(driver_phone !== undefined ? { driver_phone } : {}),
      ...(notes !== undefined ? { notes } : {}),
    };

    const updatedItems = {
      ...existingItems,
      _delivery: updatedDelivery,
    };

    const updatePayload: Record<string, any> = {
      items: updatedItems,
    };

    if (status) {
      updatePayload.status = status;
    }

    // 2. Update order
    const { data: updatedOrder, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("ticket_id", ticket_id)
      .select()
      .single();

    if (error) {
      console.error("⚠️ Error actualizando pedido:", error);
      return new Response(JSON.stringify({ 
        error: "Falla al actualizar orden.", 
        details: error.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Stock deduction logic when transitioning to 'verified'
    if (targetStatus === "verified" && previousStatus !== "verified") {
      try {
        const { data: orderItems } = await supabaseAdmin
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", currentOrder.id);

        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            if (item.product_id && item.quantity > 0) {
              const { data: prod } = await supabaseAdmin
                .from("products")
                .select("id, stock_quantity")
                .eq("id", item.product_id)
                .single();

              if (prod) {
                const newStock = Math.max(0, (prod.stock_quantity || 0) - item.quantity);
                await supabaseAdmin
                  .from("products")
                  .update({ stock_quantity: newStock })
                  .eq("id", item.product_id);
              }
            }
          }
          console.log(`✅ Stock descontado para orden ${ticket_id} desde order_items.`);
        } else if (currentOrder.items && typeof currentOrder.items === 'object') {
          // Fallback if order_items was empty
          const rawItems = Object.values(currentOrder.items) as any[];
          for (const it of rawItems) {
            if (it.name && it.quantity > 0) {
              const { data: prod } = await supabaseAdmin
                .from("products")
                .select("id, stock_quantity")
                .eq("name", it.name)
                .single();

              if (prod) {
                const newStock = Math.max(0, (prod.stock_quantity || 0) - it.quantity);
                await supabaseAdmin
                  .from("products")
                  .update({ stock_quantity: newStock })
                  .eq("id", prod.id);
              }
            }
          }
          console.log(`✅ Stock descontado para orden ${ticket_id} desde fallback items JSON.`);
        }

        invalidateCatalogCache();
      } catch (stockErr) {
        console.error("⚠️ Error descontando stock de productos:", stockErr);
      }
    }

    return new Response(JSON.stringify({ 
        message: "Orden actualizada.",
        data: updatedOrder
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("💥 Error crítico en PATCH /api/update-order:", err);
    return new Response(JSON.stringify({ error: "Falla interna del búnker." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
