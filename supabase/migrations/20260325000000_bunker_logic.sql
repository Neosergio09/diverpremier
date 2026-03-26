-- Idempotent setup for the bunker logic

-- 1. Create Tables if they don't exist
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- Note: We assume basic RLS setup where public can read catalog, but inserts are restricted
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies using DO blocks to avoid errors if they exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public read products'
    ) THEN
        CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public read categories'
    ) THEN
        CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Advanced SQL Views
-- view_product_catalog returning uuid, product_name, category_name, price, stock_status
CREATE OR REPLACE VIEW view_product_catalog AS
SELECT 
    p.id AS uuid,
    p.name AS product_name,
    c.name AS category_name,
    p.price as price,
    CASE 
        WHEN p.stock_quantity > 10 THEN 'IN STOCK'
        WHEN p.stock_quantity > 0 AND p.stock_quantity <= 10 THEN 'LOW STOCK'
        ELSE 'OUT OF STOCK'
    END AS stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- 3. Automated Triggers
-- PL/pgSQL function to subtract quantity from products
CREATE OR REPLACE FUNCTION process_verified_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the status changed to 'verified'
    IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
        -- Subtract the quantity from the products table for each item in order_items
        UPDATE products p
        SET stock_quantity = p.stock_quantity - oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires when an order status changes
-- Drop trigger if exists to be idempotent
DROP TRIGGER IF EXISTS trigger_verify_order ON orders;

CREATE TRIGGER trigger_verify_order
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION process_verified_order();
