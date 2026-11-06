CREATE TABLE token_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  action text NOT NULL,
  action_date date NOT NULL DEFAULT CURRENT_DATE,
  details text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON token_history TO anon, authenticated;

CREATE POLICY "anon_select_token_history" ON token_history FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_token_history" ON token_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_token_history" ON token_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_token_history" ON token_history FOR DELETE
  TO anon, authenticated USING (true);

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS register_status text NOT NULL DEFAULT '';
