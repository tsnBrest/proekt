/*
# Extend equipment fields and create taximeters table

1. Modified Tables
- `workstations` (ПК register)
  - New column `token_number` (text, default '') - token number of the workstation
  - New column `client_id` (uuid, optional, FK to clients.id ON DELETE SET NULL) - ownership/belonging
  - New column `installation_address` (text, default '') - installation address
  - Index on `client_id` for fast lookup
- `equipment` (cash register register)
  - New column `installation_address` (text, default '') - installation address of the cash register

2. New Tables
- `taximeters`: register of taximeters.
  - `id` (uuid, primary key)
  - `number` (text, required) - taximeter number
  - `model` (text, required) - taximeter model
  - `software_version` (text, default '') - software version
  - `client_id` (uuid, optional, FK to clients.id ON DELETE SET NULL) - ownership/belonging
  - `car` (text, default '') - associated vehicle
  - `created_at`, `updated_at` (timestamptz)

3. Security
- RLS enabled on `taximeters`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `taximeters` to anon and authenticated.
- Four separate policies (select/insert/update/delete) with USING (true) / WITH CHECK (true) because the data is intentionally public/shared (single-tenant, no auth).
- No change to access policies or grants on existing tables (new columns inherit existing grants).

4. Notes
- All ALTER TABLE additions use IF NOT EXISTS, so the migration is idempotent and safe to re-run.
- Existing records keep their default values for new columns; no data is lost.
- Indexes on client_id for workstations and taximeters for fast ownership lookups.
*/

ALTER TABLE workstations ADD COLUMN IF NOT EXISTS token_number text NOT NULL DEFAULT '';
ALTER TABLE workstations ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE workstations ADD COLUMN IF NOT EXISTS installation_address text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS workstations_client_id_idx ON workstations (client_id);

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS installation_address text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS taximeters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  software_version text NOT NULL DEFAULT '',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  car text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taximeters_client_id_idx ON taximeters (client_id);
CREATE INDEX IF NOT EXISTS taximeters_number_idx ON taximeters (number);

ALTER TABLE taximeters ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON taximeters TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_taximeters" ON taximeters;
CREATE POLICY "anon_select_taximeters" ON taximeters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_taximeters" ON taximeters;
CREATE POLICY "anon_insert_taximeters" ON taximeters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_taximeters" ON taximeters;
CREATE POLICY "anon_update_taximeters" ON taximeters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_taximeters" ON taximeters;
CREATE POLICY "anon_delete_taximeters" ON taximeters FOR DELETE
  TO anon, authenticated USING (true);
