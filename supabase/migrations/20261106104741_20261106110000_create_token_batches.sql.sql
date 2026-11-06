/*
# Create token_batches table

Stores batch arrivals of tokens — a range from start_number to end_number
received under a given operator label (АЙЭМЛЭБ or ЦПИ).
*/

CREATE TABLE IF NOT EXISTS token_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_label text NOT NULL,
  start_number text NOT NULL,
  end_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_batches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON token_batches TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_token_batches" ON token_batches;
CREATE POLICY "anon_select_token_batches" ON token_batches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_token_batches" ON token_batches;
CREATE POLICY "anon_insert_token_batches" ON token_batches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_token_batches" ON token_batches;
CREATE POLICY "anon_update_token_batches" ON token_batches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_token_batches" ON token_batches;
CREATE POLICY "anon_delete_token_batches" ON token_batches FOR DELETE
  TO anon, authenticated USING (true);
