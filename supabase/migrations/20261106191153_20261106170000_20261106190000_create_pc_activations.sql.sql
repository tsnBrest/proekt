/*
# Create pc_activations table

1. New Tables
- `pc_activations` — stores records of PC activations performed in the СККО system.
  - `id` (uuid, primary key)
  - `activation_date` (date, when the activation was performed)
  - `client_id` (uuid, FK to clients, nullable — which client the activation is for)
  - `device_kind` (text, 'token' or 'cloud' — distinguishes token vs cloud cash register)
  - `device_id` (uuid, FK to tokens or cloud_cash_registers depending on device_kind)
  - `device_number` (text, the token number or cloud register model identifier)
  - `previous_status` (text, the status before the activation)
  - `new_status` (text, the status set during activation)
  - `reg_number_skko` (text, registration number in СККО)
  - `notes` (text, additional notes)
  - `created_at` (timestamptz, record creation timestamp)

2. Security
- Enable RLS on `pc_activations`.
- Grant CRUD to `anon` + `authenticated` (single-tenant, no auth — data is shared).
- Allow anon + authenticated full CRUD because the data is intentionally shared.

3. Indexes
- Index on `client_id` for client-based filtering.
- Index on `activation_date` for date-based filtering.
*/

CREATE TABLE IF NOT EXISTS pc_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_date date NOT NULL DEFAULT CURRENT_DATE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  device_kind text NOT NULL DEFAULT 'token',
  device_id uuid,
  device_number text NOT NULL DEFAULT '',
  previous_status text NOT NULL DEFAULT '',
  new_status text NOT NULL DEFAULT '',
  reg_number_skko text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pc_activations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON pc_activations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_pc_activations" ON pc_activations;
CREATE POLICY "anon_select_pc_activations" ON pc_activations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pc_activations" ON pc_activations;
CREATE POLICY "anon_insert_pc_activations" ON pc_activations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pc_activations" ON pc_activations;
CREATE POLICY "anon_update_pc_activations" ON pc_activations
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pc_activations" ON pc_activations;
CREATE POLICY "anon_delete_pc_activations" ON pc_activations
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_pc_activations_client_id ON pc_activations(client_id);
CREATE INDEX IF NOT EXISTS idx_pc_activations_activation_date ON pc_activations(activation_date);
