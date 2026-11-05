/*
# Create tokens reference table

1. New Tables
- `tokens`: directory of tokens for ikassa and CPI operators.
  - `id` (uuid, primary key)
  - `number` (text, required) - token number/identifier
  - `operator_type` (text, required) - one of 'ikassa' or 'cpi'
  - `created_at`, `updated_at` (timestamptz)

2. Security
- RLS enabled on `tokens`.
- No sign-in in this app, so the anon and authenticated roles get full access to this intentionally shared table.
- Grants: SELECT, INSERT, UPDATE, DELETE on `tokens` to anon and authenticated.
- Four separate policies (select/insert/update/delete) with USING (true) / WITH CHECK (true) because the data is intentionally public/shared (single-tenant, no auth).

3. Notes
- The migration is idempotent: the table, grants, and policies are created only if missing.
- The CHECK constraint on operator_type ensures only valid operator types are stored.
- A unique constraint on (number, operator_type) prevents duplicate tokens within the same operator.
- Index on operator_type for efficient filtering.
- To find tokens not assigned to any workstation, the frontend queries tokens and excludes those whose `number` matches a workstation's `token_number`.
*/

CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  operator_type text NOT NULL CHECK (operator_type IN ('ikassa', 'cpi')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tokens_number_operator_idx ON tokens (number, operator_type);
CREATE INDEX IF NOT EXISTS tokens_operator_type_idx ON tokens (operator_type);

ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON tokens TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_tokens" ON tokens;
CREATE POLICY "anon_select_tokens" ON tokens FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tokens" ON tokens;
CREATE POLICY "anon_insert_tokens" ON tokens FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tokens" ON tokens;
CREATE POLICY "anon_update_tokens" ON tokens FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tokens" ON tokens;
CREATE POLICY "anon_delete_tokens" ON tokens FOR DELETE
  TO anon, authenticated USING (true);
