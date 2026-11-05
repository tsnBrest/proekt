/*
# Create equipment_models reference table

1. New Tables
- `equipment_models`: directory of equipment models with a default software version.
  - `id` (uuid, primary key)
  - `model` (text, required, unique) - model name, e.g. "Атол 11Ф"
  - `software_version` (text, optional) - default software version for this model, e.g. "5.6.2"
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `equipment_models`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `equipment_models` to anon and authenticated.
- Four separate policies (select/insert/update/delete) with USING (true) / WITH CHECK (true) because the data is intentionally public/shared (single-tenant, no auth).

3. Notes
- The migration is idempotent: the table, grants, and policies are created only if missing.
- The unique constraint on `model` prevents duplicate model entries; the frontend reports a friendly "already exists" message on duplicate inserts.
*/

CREATE TABLE IF NOT EXISTS equipment_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL UNIQUE,
  software_version text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON equipment_models TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_equipment_models" ON equipment_models;
CREATE POLICY "anon_select_equipment_models" ON equipment_models FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equipment_models" ON equipment_models;
CREATE POLICY "anon_insert_equipment_models" ON equipment_models FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equipment_models" ON equipment_models;
CREATE POLICY "anon_update_equipment_models" ON equipment_models FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equipment_models" ON equipment_models;
CREATE POLICY "anon_delete_equipment_models" ON equipment_models FOR DELETE
  TO anon, authenticated USING (true);
