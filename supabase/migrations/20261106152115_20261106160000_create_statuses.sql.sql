/*
# Create statuses table

1. New Tables
- `statuses`
  - `id` (uuid, primary key)
  - `name` (text, not null) — the status label displayed in dropdowns
  - `category` (text, not null) — either 'cash_register' or 'token', distinguishing which type of entity the status applies to
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `statuses`.
- Grant CRUD to `anon` + `authenticated` so the Data API can reach the table (single-tenant, no auth).
- Allow anon + authenticated full CRUD because the data is intentionally shared/public.
3. Seed data
- Cash register statuses: "не зарегистрирована", "зарегистрирована облачная", "зарегистрирована токен", "снята с регистрации"
- Token statuses: "присвоен", "зарегистрирован", "пауза", "блокировка", "снят с регистрации"
*/

CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('cash_register', 'token')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON statuses TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_statuses" ON statuses;
CREATE POLICY "anon_select_statuses" ON statuses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_statuses" ON statuses;
CREATE POLICY "anon_insert_statuses" ON statuses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_statuses" ON statuses;
CREATE POLICY "anon_update_statuses" ON statuses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_statuses" ON statuses;
CREATE POLICY "anon_delete_statuses" ON statuses FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO statuses (name, category) VALUES
  ('не зарегистрирована', 'cash_register'),
  ('зарегистрирована облачная', 'cash_register'),
  ('зарегистрирована токен', 'cash_register'),
  ('снята с регистрации', 'cash_register'),
  ('присвоен', 'token'),
  ('зарегистрирован', 'token'),
  ('пауза', 'token'),
  ('блокировка', 'token'),
  ('снят с регистрации', 'token')
ON CONFLICT DO NOTHING;
