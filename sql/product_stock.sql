-- 1. Create the `products` table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add an index for faster queries by merchant
CREATE INDEX idx_products_merchant_id ON products(merchant_id);

-- Enable RLS on products (optional, depending on your existing setup)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated access to products" ON products FOR ALL TO authenticated USING (true);


-- 2. Create the `stock_entries` table
CREATE TABLE stock_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for faster filtering
CREATE INDEX idx_stock_entries_merchant_id ON stock_entries(merchant_id);
CREATE INDEX idx_stock_entries_product_id ON stock_entries(product_id);
CREATE INDEX idx_stock_entries_status ON stock_entries(status);

-- Enable RLS on stock_entries (optional, depending on your existing setup)
-- ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated access to stock_entries" ON stock_entries FOR ALL TO authenticated USING (true);
