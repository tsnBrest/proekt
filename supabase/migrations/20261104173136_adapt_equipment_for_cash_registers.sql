/*
# Adapt equipment table for cash registers

1. Modified Tables
- `equipment`
  - New column `software_version` (text, default empty string) - software version of the cash register.
  - Column `name` no longer required, so new cash register records can be saved with model, factory number and software version only.

2. Notes
- Existing columns are kept unchanged, so no data is lost.
- The factory number is stored in the existing `serial_number` column and the model in the existing `model` column.
- The migration is idempotent and safe to re-run.

3. Security
- No change to access policies or grants.
*/

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_version text NOT NULL DEFAULT '';

ALTER TABLE equipment ALTER COLUMN name DROP NOT NULL;
