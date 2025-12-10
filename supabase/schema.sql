-- Supabase Database Schema for Mnandi Flame-Grilled

-- Business Status Table
-- Stores the current open/closed status of the business for cross-device synchronization
CREATE TABLE IF NOT EXISTS business_status (
  id TEXT PRIMARY KEY DEFAULT 'current',
  is_open BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_status_id ON business_status(id);

-- Orders Table
-- Stores all customer orders for persistence across devices
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  confirmation_number TEXT UNIQUE NOT NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
  delivery_address TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_number ON orders(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE business_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read business status (public read)
CREATE POLICY "Allow public read access to business_status"
  ON business_status FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert/update business status (public write)
-- Note: In production, you may want to restrict this to authenticated users
CREATE POLICY "Allow public write access to business_status"
  ON business_status FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to read orders (public read)
CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert orders (public write)
CREATE POLICY "Allow public insert access to orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update orders (public write)
-- Note: In production, you may want to restrict updates to authenticated users
CREATE POLICY "Allow public update access to orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert initial business status
INSERT INTO business_status (id, is_open, message, updated_at, updated_by)
VALUES ('current', true, NULL, NOW(), 'system')
ON CONFLICT (id) DO NOTHING;


