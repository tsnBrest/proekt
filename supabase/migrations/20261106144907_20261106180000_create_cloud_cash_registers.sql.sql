/*
# Create cloud_cash_registers table

1. New Tables
- `cloud_cash_registers`: directory of cloud cash registers (DusicCloud).
  - `id` (uuid, primary key)
  - `client_id` (uuid, FK to clients, nullable) - which client the register belongs to
  - `pc_model` (text) - PC model name (filtered to Dusic in the UI)
  - `pc_software_version` (text) - PC software version
  - `equipment_model` (text) - equipment model
  - `equipment_serial_number` (text) - equipment serial number
  - `equipment_name` (text) - equipment name
  - `equipment_status` (text) - equipment ownership status
  - `installation_name` (text) - installation name
  - `pc_installation_address` (text) - PC installation address
  - `working_hours` (text) - working hours
  - `gln` (text) - GLN code
  - `to_type` (text) - trade object type
  - `to_name` (text) - trade object name
  - `contract_number` (text) - contract number
  - `register_status` (text) - registration status of the cloud cash register
  - `itp_price` (numeric(12,3), default 0) - ITP service price
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `cloud_cash_registers`.
- No sign-in in this app, so the anon and authenticated roles get full access.
- Grants: SELECT, INSERT, UPDATE, DELETE on `cloud_cash_registers` to anon and authenticated.
- Four separate policies (select/insert/update/delete) with USING (true) / WITH CHECK (true).

3. Notes
- The migration is idempotent.
- Index on client_id for efficient filtering by client.
*/

CREATE TABLE IF NOT EXISTS cloud_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  pc_model text NOT NULL DEFAULT '',
  pc_software_version text NOT NULL DEFAULT '',
  equipment_model text NOT NULL DEFAULT '',
  equipment_serial_number text NOT NULL DEFAULT '',
  equipment_name text NOT NULL DEFAULT '',
  equipment_status text NOT NULL DEFAULT '',
  installation_name text NOT NULL DEFAULT '',
  pc_installation_address text NOT NULL DEFAULT '',
  working_hours text NOT NULL DEFAULT '',
  gln text NOT NULL DEFAULT '',
  to_type text NOT NULL DEFAULT '',
  to_name text NOT NULL DEFAULT '',
  contract_number text NOT NULL DEFAULT '',
  register_status text NOT NULL DEFAULT '',
  itp_price numeric(12,3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cloud_cash_registers_client_id_idx ON cloud_cash_registers (client_id);

ALTER TABLE cloud_cash_registers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cloud_cash_registers TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_cloud_cash_registers" ON cloud_cash_registers;
CREATE POLICY "anon_select_cloud_cash_registers" ON cloud_cash_registers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cloud_cash_registers" ON cloud_cash_registers;
CREATE POLICY "anon_insert_cloud_cash_registers" ON cloud_cash_registers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cloud_cash_registers" ON cloud_cash_registers;
CREATE POLICY "anon_update_cloud_cash_registers" ON cloud_cash_registers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cloud_cash_registers" ON cloud_cash_registers;
CREATE POLICY "anon_delete_cloud_cash_registers" ON cloud_cash_registers FOR DELETE
  TO anon, authenticated USING (true);
