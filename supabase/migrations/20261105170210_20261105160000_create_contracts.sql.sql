/*
# Create contracts table (single-tenant, no auth)

1. New Tables
- `contracts`
  - `id` (uuid, primary key)
  - `number` (text, not null) — № договора
  - `client_id` (uuid, nullable, FK to clients) — принадлежность
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `contracts`.
- Grant CRUD to `anon` + `authenticated` (single-tenant no-auth app).
- Allow anon + authenticated full CRUD (data is intentionally shared).
*/

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_contracts" ON contracts;
CREATE POLICY "anon_select_contracts" ON contracts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contracts" ON contracts;
CREATE POLICY "anon_insert_contracts" ON contracts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_contracts" ON contracts;
CREATE POLICY "anon_update_contracts" ON contracts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contracts" ON contracts;
CREATE POLICY "anon_delete_contracts" ON contracts FOR DELETE
  TO anon, authenticated USING (true);
