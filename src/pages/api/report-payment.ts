export const prerender = false;
import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { ticket_id, receipt_url, customer_name, customer_phone, notes } = data;

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: "Ticket ID es requerido para reportar el pago." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch current order
    const { data: currentOrder, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, items")
      .eq("ticket_id", ticket_id)
      .single();

    if (fetchErr || !currentOrder) {
      return new Response(
        JSON.stringify({ error: "Orden no encontrada en el búnker.", details: fetchErr?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Prepare items with _delivery metadata update
    const existingItems = (typeof currentOrder.items === "object" && currentOrder.items) || {};
    const existingDelivery = existingItems._delivery || {};

    const updatedDelivery = {
      ...existingDelivery,
      ...(receipt_url ? { receipt_url } : {}),
      ...(customer_name ? { customer_name } : {}),
      ...(customer_phone ? { customer_phone } : {}),
      ...(notes ? { notes } : {}),
      payment_reported_at: new Date().toISOString(),
    };

    const updatedItems = {
      ...existingItems,
      _delivery: updatedDelivery,
    };

    // 3. Update status to 'verification_pending' and update items
    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "verification_pending",
        items: updatedItems,
      })
      .eq("ticket_id", ticket_id)
      .select()
      .single();

    if (updateErr) {
      console.error("⚠️ Error al reportar pago:", updateErr);
      return new Response(
        JSON.stringify({ error: "No se pudo actualizar el pago.", details: updateErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pago reportado correctamente. El búnker está verificando la transferencia.",
        data: updatedOrder,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Error crítico en POST /api/report-payment:", err);
    return new Response(
      JSON.stringify({ error: "Falla interna del servidor.", details: err?.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
