CREATE TABLE IF NOT EXISTS pc_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'аренда банка' CHECK (status IN ('аренда банка', 'аренда ЦТО', 'покупка в Анъюск', 'собственность клиента')),
  supplier text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pc_equipment_serial_number_idx ON pc_equipment (serial_number);

ALTER TABLE pc_equipment ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON pc_equipment TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_pc_equipment" ON pc_equipment;
CREATE POLICY "anon_select_pc_equipment" ON pc_equipment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pc_equipment" ON pc_equipment;
CREATE POLICY "anon_insert_pc_equipment" ON pc_equipment FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pc_equipment" ON pc_equipment;
CREATE POLICY "anon_update_pc_equipment" ON pc_equipment FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pc_equipment" ON pc_equipment;
CREATE POLICY "anon_delete_pc_equipment" ON pc_equipment FOR DELETE
  TO anon, authenticated USING (true);
