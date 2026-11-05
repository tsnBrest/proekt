/*
# Create equipment table

1. New Tables
- `equipment`: register of equipment items.
  - `id` (uuid, primary key)
  - `name` (text, required) - equipment name
  - `model` (text) - model
  - `manufacturer` (text) - manufacturer
  - `serial_number` (text) - serial number
  - `unit` (text, required, default 'шт.') - unit of measure
  - `quantity` (integer, required, default 1, must be 0 or more) - number of units
  - `price` (numeric(12,2), optional, must be 0 or more) - price per unit
  - `notes` (text) - comments
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `equipment`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `equipment` to anon and authenticated.

3. Notes
- The migration is idempotent: the table and policies are created only if missing.
*/

CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text NOT NULL DEFAULT '',
  manufacturer text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'шт.',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  price numeric(12,2) CHECK (price IS NULL OR price >= 0),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS equipment_name_idx ON equipment (name);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_equipment" ON equipment;
CREATE POLICY "anon_select_equipment" ON equipment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equipment" ON equipment;
CREATE POLICY "anon_insert_equipment" ON equipment FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equipment" ON equipment;
CREATE POLICY "anon_update_equipment" ON equipment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equipment" ON equipment;
CREATE POLICY "anon_delete_equipment" ON equipment FOR DELETE
  TO anon, authenticated USING (true);
