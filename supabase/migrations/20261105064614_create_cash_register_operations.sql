/*
# Create cash_register_operations table

1. New Tables
- `cash_register_operations`: log of operations performed on cash registers.
  - `id` (uuid, primary key)
  - `equipment_id` (uuid, foreign key to equipment.id, ON DELETE CASCADE) - which cash register the operation applies to
  - `operation_type` (text, required) - one of: 'registration', 'deregistration', 'address_change', 'repair'
  - `operation_date` (date, required, default CURRENT_DATE) - when the operation was performed
  - `address` (text, default '') - installation or new address (used for registration and address_change)
  - `notes` (text, default '') - reason, repair description, or general notes
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `cash_register_operations`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `cash_register_operations` to anon and authenticated.
- Four separate policies (select/insert/update/delete) with USING (true) / WITH CHECK (true) because the data is intentionally public/shared (single-tenant, no auth).

3. Notes
- The migration is idempotent: the table, grants, and policies are created only if missing.
- The CHECK constraint on operation_type ensures only valid operation types are stored.
- Index on operation_type for efficient filtering by operation type.
- Index on operation_date for chronological sorting.
*/

CREATE TABLE IF NOT EXISTS cash_register_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('registration', 'deregistration', 'address_change', 'repair')),
  operation_date date NOT NULL DEFAULT CURRENT_DATE,
  address text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_register_operations_type_idx ON cash_register_operations (operation_type);
CREATE INDEX IF NOT EXISTS cash_register_operations_date_idx ON cash_register_operations (operation_date DESC);

ALTER TABLE cash_register_operations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON cash_register_operations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_cash_register_operations" ON cash_register_operations;
CREATE POLICY "anon_select_cash_register_operations" ON cash_register_operations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cash_register_operations" ON cash_register_operations;
CREATE POLICY "anon_insert_cash_register_operations" ON cash_register_operations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cash_register_operations" ON cash_register_operations;
CREATE POLICY "anon_update_cash_register_operations" ON cash_register_operations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cash_register_operations" ON cash_register_operations;
CREATE POLICY "anon_delete_cash_register_operations" ON cash_register_operations FOR DELETE
  TO anon, authenticated USING (true);
