ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS equipment_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS equipment_serial_number_cpi text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS equipment_status text NOT NULL DEFAULT ''
  CHECK (equipment_status = '' OR equipment_status IN ('аренда банка', 'аренда ЦТО', 'покупка в Анъюск', 'собственность клиента'));
