-- ==============================================================================
-- Diverpremier Go: Habilitar Realtime en Publicación de PostgreSQL
-- ==============================================================================

-- 1. Añadir tablas principales a la publicación de Supabase Realtime
DO $$
BEGIN
    -- Habilitar réplica completa para incluir registros antiguos y nuevos en eventos UPDATE
    ALTER TABLE orders REPLICA IDENTITY FULL;
    ALTER TABLE products REPLICA IDENTITY FULL;
    ALTER TABLE order_items REPLICA IDENTITY FULL;

    -- Agregar 'orders' a supabase_realtime si no está
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;

    -- Agregar 'products' a supabase_realtime si no está
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
    END IF;

    -- Agregar 'order_items' a supabase_realtime si no está
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    END IF;
END $$;
