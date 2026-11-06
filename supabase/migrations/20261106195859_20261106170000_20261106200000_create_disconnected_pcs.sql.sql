/*
# Create disconnected_pcs table

1. New Tables
- `disconnected_pcs` — stores records of PCs (tokens and cloud cash registers) that have been
  disconnected/deregistered. These are moved here from the tokens and cloud_cash_registers tables
  when a "Снятие ПК" (deregistration) operation is performed.
  - `id` (uuid, primary key)
  - `original_table` (text, 'tokens' or 'cloud_cash_registers' — where the record came from)
  - `original_id` (uuid, the original record's id)
  - `operator_type` (text, for tokens: 'ikassa' or 'cpi'; empty for cloud)
  - `number` (text, token number or cloud identifier)
  - `pc_model` (text)
  - `pc_software_version` (text)
  - `client_id` (uuid, FK to clients, nullable)
  - `equipment_model` (text)
  - `equipment_serial_number` (text)
  - `equipment_name` (text)
  - `installation_name` (text)
  - `pc_installation_address` (text)
  - `working_hours` (text)
  - `gln` (text)
  - `to_type` (text)
  - `to_name` (text)
  - `contract_number` (text)
  - `itp_price` (numeric, default 0)
  - `previous_status` (text, status before disconnection)
  - `disconnect_reason` (text, reason for disconnection)
  - `disconnect_date` (date, when the disconnection happened)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `disconnected_pcs`.
- Grant CRUD to `anon` + `authenticated` (single-tenant, no auth).
- Allow anon + authenticated full CRUD because the data is intentionally shared.

3. Indexes
- Index on `client_id` for filtering.
- Index on `original_table` for source-based queries.
*/

CREATE TABLE IF NOT EXISTS disconnected_pcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_table text NOT NULL DEFAULT '',
  original_id uuid,
  operator_type text NOT NULL DEFAULT '',
  number text NOT NULL DEFAULT '',
  pc_model text NOT NULL DEFAULT '',
  pc_software_version text NOT NULL DEFAULT '',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  equipment_model text NOT NULL DEFAULT '',
  equipment_serial_number text NOT NULL DEFAULT '',
  equipment_name text NOT NULL DEFAULT '',
  installation_name text NOT NULL DEFAULT '',
  pc_installation_address text NOT NULL DEFAULT '',
  working_hours text NOT NULL DEFAULT '',
  gln text NOT NULL DEFAULT '',
  to_type text NOT NULL DEFAULT '',
  to_name text NOT NULL DEFAULT '',
  contract_number text NOT NULL DEFAULT '',
  itp_price numeric NOT NULL DEFAULT 0,
  previous_status text NOT NULL DEFAULT '',
  disconnect_reason text NOT NULL DEFAULT '',
  disconnect_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE disconnected_pcs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON disconnected_pcs TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_disconnected_pcs" ON disconnected_pcs;
CREATE POLICY "anon_select_disconnected_pcs" ON disconnected_pcs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_disconnected_pcs" ON disconnected_pcs;
CREATE POLICY "anon_insert_disconnected_pcs" ON disconnected_pcs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_disconnected_pcs" ON disconnected_pcs;
CREATE POLICY "anon_update_disconnected_pcs" ON disconnected_pcs
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_disconnected_pcs" ON disconnected_pcs;
CREATE POLICY "anon_delete_disconnected_pcs" ON disconnected_pcs
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_disconnected_pcs_client_id ON disconnected_pcs(client_id);
CREATE INDEX IF NOT EXISTS idx_disconnected_pcs_original_table ON disconnected_pcs(original_table);
