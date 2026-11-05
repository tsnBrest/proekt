/*
# Extend clients, make workstation_id nullable, create serviced_equipment

1. Modified Tables
- `clients`: new optional columns:
  - `bank_bik` (text, default '') — bank BIK code, auto-filled from the selected bank
  - `phone` (text, default '') — contact phone
  - `email` (text, default '') — contact email
  - `director_basis` (text, default '') — "Директор на основании": устав / доверенность / произвольный текст
  - `is_ip` (boolean, default false) — whether the client is an individual entrepreneur (ИП)
  - `registration_certificate` (text, default '') — ИП: свидетельство о регистрации
  - `registered_by` (text, default '') — ИП: кем зарегистрировано (datalist with memory)
  - `registered_at` (date, nullable) — ИП: когда выдано (calendar + manual mask)
- `workstation_operations`: make `workstation_id` nullable (was NOT NULL)
- `clients`: drop the УНП CHECK constraint so ИП clients (which may not have a УНП) can be saved

2. New Tables
- `serviced_equipment`: register of equipment under service (обслуживаемое оборудование).
  - `id` (uuid, primary key)
  - `model` (text, required)
  - `serial_number` (text, default '')
  - `software_version` (text, default '')
  - `client_id` (uuid, nullable, FK to clients.id ON DELETE SET NULL)
  - `created_at`, `updated_at` (timestamptz)

3. Security
- RLS enabled on `serviced_equipment`.
- No sign-in in this app, so anon + authenticated get full access.
- Grants: SELECT, INSERT, UPDATE, DELETE on `serviced_equipment` to anon and authenticated.

4. Notes
- All column additions use DO block — idempotent.
- Making workstation_id nullable preserves existing rows.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'bank_bik') THEN
    ALTER TABLE clients ADD COLUMN bank_bik text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'phone') THEN
    ALTER TABLE clients ADD COLUMN phone text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'email') THEN
    ALTER TABLE clients ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'director_basis') THEN
    ALTER TABLE clients ADD COLUMN director_basis text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_ip') THEN
    ALTER TABLE clients ADD COLUMN is_ip boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'registration_certificate') THEN
    ALTER TABLE clients ADD COLUMN registration_certificate text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'registered_by') THEN
    ALTER TABLE clients ADD COLUMN registered_by text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'registered_at') THEN
    ALTER TABLE clients ADD COLUMN registered_at date;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_unp_check') THEN
    ALTER TABLE clients DROP CONSTRAINT clients_unp_check;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workstation_operations' AND column_name = 'workstation_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE workstation_operations ALTER COLUMN workstation_id DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS serviced_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  serial_number text NOT NULL DEFAULT '',
  software_version text NOT NULL DEFAULT '',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS serviced_equipment_client_id_idx ON serviced_equipment (client_id);

ALTER TABLE serviced_equipment ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON serviced_equipment TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_serviced_equipment" ON serviced_equipment;
CREATE POLICY "anon_select_serviced_equipment" ON serviced_equipment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_serviced_equipment" ON serviced_equipment;
CREATE POLICY "anon_insert_serviced_equipment" ON serviced_equipment FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_serviced_equipment" ON serviced_equipment;
CREATE POLICY "anon_update_serviced_equipment" ON serviced_equipment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_serviced_equipment" ON serviced_equipment;
CREATE POLICY "anon_delete_serviced_equipment" ON serviced_equipment FOR DELETE
  TO anon, authenticated USING (true);
