/*
# Create banks and clients tables

1. New Tables
- `banks`: list of banks that can be picked for a client.
  - `id` (uuid, primary key)
  - `name` (text, unique, required) - bank name
  - `address` (text) - bank address, filled in automatically on client forms
  - `created_at` (timestamptz)
- `clients`: client records.
  - `id` (uuid, primary key)
  - `name` (text, required) - client name
  - `unp` (text, required, exactly 9 digits) - UNP tax number
  - `legal_address` (text, required)
  - `postal_address` (text, optional)
  - `bank_account` (text, required) - settlement account
  - `bank_id` (uuid, required, references banks)
  - `bank_address` (text) - copy of the bank address at the time of entry, editable
  - `director_name` (text, required) - director full name
  - `director_name_genitive` (text, required) - director name in genitive case for contracts
  - `created_at`, `updated_at` (timestamptz)

2. Seed data
- A starter list of Belarusian banks is inserted into `banks`. Addresses are left empty and can be filled in from the app.

3. Security
- RLS enabled on both tables.
- No sign-in in this app, so the anon and authenticated roles get full access to these intentionally shared tables.
- Grants: SELECT, INSERT, UPDATE on `banks`; SELECT, INSERT, UPDATE, DELETE on `clients`.

4. Notes
- Deleting a bank that clients still use is blocked by the foreign key (ON DELETE RESTRICT).
- Migration is idempotent: tables and seed rows are created only if missing.
*/

CREATE TABLE IF NOT EXISTS banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unp text NOT NULL CHECK (unp ~ '^[0-9]{9}$'),
  legal_address text NOT NULL,
  postal_address text NOT NULL DEFAULT '',
  bank_account text NOT NULL,
  bank_id uuid NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
  bank_address text NOT NULL DEFAULT '',
  director_name text NOT NULL,
  director_name_genitive text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clients_bank_id_idx ON clients (bank_id);
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients (name);

ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON banks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_banks" ON banks;
CREATE POLICY "anon_select_banks" ON banks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_banks" ON banks;
CREATE POLICY "anon_insert_banks" ON banks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_banks" ON banks;
CREATE POLICY "anon_update_banks" ON banks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO banks (name) VALUES
  ('ОАО «Беларусбанк»'),
  ('ОАО «Белагропромбанк»'),
  ('ОАО «Белгазпромбанк»'),
  ('ОАО «Банк БелВЭБ»'),
  ('ЗАО «Приорбанк»'),
  ('ОАО «БПС-Сбербанк»'),
  ('ЗАО «Альфа-Банк»'),
  ('ОАО «БелИнвестБанк»'),
  ('ЗАО «Банк ВТБ (Беларусь)»'),
  ('ЗАО «Технобанк»'),
  ('ЗАО «МТБанк»'),
  ('ОАО «Паритетбанк»')
ON CONFLICT (name) DO NOTHING;
