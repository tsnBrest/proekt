GRANT SELECT, INSERT, UPDATE, DELETE ON price_list TO anon;

CREATE POLICY "anon_select_price_list" ON price_list FOR SELECT
  TO anon USING (true);
CREATE POLICY "anon_insert_price_list" ON price_list FOR INSERT
  TO anon WITH CHECK (true);
CREATE POLICY "anon_update_price_list" ON price_list FOR UPDATE
  TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_price_list" ON price_list FOR DELETE
  TO anon USING (true);
