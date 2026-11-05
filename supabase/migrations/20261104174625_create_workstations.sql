/*
# Create workstations reference (Справочник ПК)

1. New Tables
- `workstations`: register of computers (ПК) used at the cash desks.
  - `id` (uuid, primary key)
  - `model` (text, required) - model of the computer
  - `software_version` (text, optional) - version of the installed software
  - `operator` (text, optional) - operator who works at this computer
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `workstations`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `workstations` to anon and authenticated.

3. Notes
- The migration is idempotent: the table and policies are created only if missing.
*/

CREATE TABLE IF NOT EXISTS workstations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  software_version text NOT NULL DEFAULT '',
  operator text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON workstations TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_workstations" ON workstations;
CREATE POLICY "anon_select_workstations" ON workstations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workstations" ON workstations;
CREATE POLICY "anon_insert_workstations" ON workstations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workstations" ON workstations;
CREATE POLICY "anon_update_workstations" ON workstations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workstations" ON workstations;
CREATE POLICY "anon_delete_workstations" ON workstations FOR DELETE
  TO anon, authenticated USING (true);
