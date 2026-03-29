export const prerender = false;
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const slugify = (text: string) => 
    text.toString().toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const POST: APIRoute = async ({ request }) => {
    try {
        const supabaseAdmin = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const products = await request.json();

        if (!Array.isArray(products) || products.length === 0) {
            return new Response(JSON.stringify({
                error: 'El búnker no recibió datos válidos para procesar.'
            }), { status: 400 });
        }

        // 🧠 GESTIÓN DINÁMICA DE CATEGORÍAS
        // 1. Extraemos nombres únicos de categorías del CSV
        const categoryNames = [...new Set(products.map((p: any) => p.category_name).filter(Boolean))];

        // 2. Traemos categorías existentes para comparar
        const { data: existingCategories } = await supabaseAdmin
            .from('categories')
            .select('id, name');

        const categoriesMap: Record<string, string> = {};
        existingCategories?.forEach(cat => {
            categoriesMap[cat.name.toLowerCase().trim()] = cat.id;
        });

        // 3. Identificamos cuáles no existen y las creamos
        const newCategoryNames = categoryNames.filter(name => !categoriesMap[name.toLowerCase().trim()]);

        if (newCategoryNames.length > 0) {
            const { data: createdCategories, error: catError } = await supabaseAdmin
                .from('categories')
                .insert(newCategoryNames.map(name => ({ 
                    name: name.trim(),
                    slug: slugify(name)
                })))
                .select();

            if (catError) {
                console.error('⚠️ Error al crear categorías:', catError);
                return new Response(JSON.stringify({ error: 'Error al sincronizar categorías en el búnker.' }), { status: 500 });
            }

            createdCategories?.forEach(cat => {
                categoriesMap[cat.name.toLowerCase().trim()] = cat.id;
            });
        }

        // 💣 Mapeo Final de Productos con IDs de Categoría
        const finalProducts = products.map((p: any) => {
            const { category_name, ...productData } = p;
            return {
                ...productData,
                category_id: category_name ? categoriesMap[category_name.toLowerCase().trim()] : null
            };
        });

        // 🚀 Inserción Masiva de Productos
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(finalProducts)
            .select();

        if (error) {
            console.error('⚠️ Error en la base de datos (productos):', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({
            message: '¡Sincronización completa! Productos y categorías actualizados.',
            count: data.length
        }), { status: 200 });

    } catch (err) {
        console.error('💥 Error crítico en la API:', err);
        return new Response(JSON.stringify({ error: 'Falla interna del búnker.' }), { status: 500 });
    }
};