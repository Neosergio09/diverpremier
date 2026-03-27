export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
    try {
        // 🔑 Creamos el cliente con la llave maestra (God Mode)
        // Usamos las variables de entorno para máxima seguridad
        const supabaseAdmin = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const products = await request.json();

        // Verificación de seguridad básica
        if (!Array.isArray(products) || products.length === 0) {
            return new Response(JSON.stringify({
                error: 'El búnker no recibió datos válidos para procesar.'
            }), { status: 400 });
        }

        // 💣 Operación Masiva: Insertamos todo el lote de una vez
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(products)
            .select();

        if (error) {
            console.error('⚠️ Error en la base de datos:', error);
            return new Response(JSON.stringify({
                error: error.message,
                code: error.code
            }), { status: 500 });
        }

        // Respuesta de éxito
        return new Response(JSON.stringify({
            message: '¡Acceso concedido! Inventario actualizado con éxito.',
            count: data.length
        }), { status: 200 });

    } catch (err) {
        console.error('💥 Error crítico en la API:', err);
        return new Response(JSON.stringify({
            error: 'Error interno del búnker. Revisa la consola del servidor.'
        }), { status: 500 });
    }
};