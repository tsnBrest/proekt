CREATE TABLE price_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_name text NOT NULL,
  price numeric(12, 3) NOT NULL DEFAULT 0,
  coefficient numeric(8, 3) NOT NULL DEFAULT 1.000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_list ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON price_list TO authenticated;

CREATE POLICY "select_own_price_list" ON price_list FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_own_price_list" ON price_list FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_price_list" ON price_list FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_own_price_list" ON price_list FOR DELETE
  TO authenticated USING (true);

ALTER TABLE tokens ADD COLUMN itp_price numeric(12, 3) NOT NULL DEFAULT 0;
