/*
# Extend workstation_operations and tokens with PC registration fields

1. workstation_operations — new columns
- `pc_model` (text, not null, default '') — модель ПК (chosen from equipment models directory)
- `pc_software_version` (text, not null, default '') — версия ПО (auto-filled from equipment models)

2. tokens — new columns (for iKassa operator)
- `to_type` (text, not null, default '') — вид ТО
- `to_name` (text, not null, default '') — наименование ТО

3. Security
- No RLS changes needed (tables already have RLS enabled and policies set).
- Grants already cover the new columns (table-level grants apply to all columns).
*/

ALTER TABLE workstation_operations
  ADD COLUMN IF NOT EXISTS pc_model text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pc_software_version text NOT NULL DEFAULT '';

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS to_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS to_name text NOT NULL DEFAULT '';
