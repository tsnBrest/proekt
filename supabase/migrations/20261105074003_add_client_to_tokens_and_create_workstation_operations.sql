/*
# Add client_id to tokens and create workstation_operations table

1. Modified Tables
- `tokens`
  - New column `client_id` (uuid, optional, FK to clients.id ON DELETE SET NULL) - the client this token belongs to
  - Index on client_id for fast lookup

2. New Tables
- `workstation_operations`: log of operations performed on workstations (ПК).
  - `id` (uuid, primary key)
  - `workstation_id` (uuid, foreign key to workstations.id, ON DELETE CASCADE) - which workstation the operation applies to
  - `operation_type` (text, required) - one of: 'registration', 'deregistration', 'address_change', 'other'
  - `operation_date` (date, required, default CURRENT_DATE) - when the operation was performed
  - `client_id` (uuid, optional, FK to clients.id ON DELETE SET NULL) - the client associated with the operation
  - `address` (text, default '') - installation or new address
  - `is_cloud` (boolean, default false) - whether the registration is cloud-based (disables token selection)
  - `token_number` (text, default '') - token number selected for this operation
  - `notes` (text, default '') - notes or description
  - `created_at`, `updated_at` (timestamptz)

3. Security
- RLS enabled on `workstation_operations`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `workstation_operations` to anon and authenticated.
- Four separate policies with USING (true) / WITH CHECK (true) (single-tenant, no auth).
- No change to existing token policies (new column inherits existing grants).

4. Notes
- All additions use IF NOT EXISTS, so the migration is idempotent and safe to re-run.
- Index on operation_type and operation_date for efficient filtering and sorting.
*/

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tokens_client_id_idx ON tokens (client_id);

CREATE TABLE IF NOT EXISTS workstation_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workstation_id uuid NOT NULL REFERENCES workstations(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('registration', 'deregistration', 'address_change', 'other')),
  operation_date date NOT NULL DEFAULT CURRENT_DATE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  address text NOT NULL DEFAULT '',
  is_cloud boolean NOT NULL DEFAULT false,
  token_number text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workstation_operations_type_idx ON workstation_operations (operation_type);
CREATE INDEX IF NOT EXISTS workstation_operations_date_idx ON workstation_operations (operation_date DESC);

ALTER TABLE workstation_operations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON workstation_operations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_workstation_operations" ON workstation_operations;
CREATE POLICY "anon_select_workstation_operations" ON workstation_operations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workstation_operations" ON workstation_operations;
CREATE POLICY "anon_insert_workstation_operations" ON workstation_operations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workstation_operations" ON workstation_operations;
CREATE POLICY "anon_update_workstation_operations" ON workstation_operations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workstation_operations" ON workstation_operations;
CREATE POLICY "anon_delete_workstation_operations" ON workstation_operations FOR DELETE
  TO anon, authenticated USING (true);
