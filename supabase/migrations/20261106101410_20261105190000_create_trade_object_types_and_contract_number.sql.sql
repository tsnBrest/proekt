/*
# Create trade_object_types table + add contract_number to tokens

1. New Tables
- `trade_object_types`
  - `id` (uuid, primary key)
  - `name` (text, not null) — тип торгового объекта
  - `created_at` (timestamptz, default now())

2. tokens — new column
- `contract_number` (text, not null, default '') — № договора с ЦТО "Анъюск"

3. Security
- RLS enabled on trade_object_types
- CRUD granted to anon+authenticated (single-tenant no-auth)
*/

CREATE TABLE IF NOT EXISTS trade_object_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trade_object_types ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON trade_object_types TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_trade_object_types" ON trade_object_types;
CREATE POLICY "anon_select_trade_object_types" ON trade_object_types FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trade_object_types" ON trade_object_types;
CREATE POLICY "anon_insert_trade_object_types" ON trade_object_types FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trade_object_types" ON trade_object_types;
CREATE POLICY "anon_update_trade_object_types" ON trade_object_types FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trade_object_types" ON trade_object_types;
CREATE POLICY "anon_delete_trade_object_types" ON trade_object_types FOR DELETE
  TO anon, authenticated USING (true);

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS contract_number text NOT NULL DEFAULT '';
