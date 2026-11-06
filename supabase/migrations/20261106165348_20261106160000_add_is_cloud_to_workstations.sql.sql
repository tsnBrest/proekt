/*
# Add is_cloud column to workstations

1. Changes
- Add `is_cloud` (boolean, default false) to `workstations` table.
  When true, the workstation's PC model is sourced from the client's cloud cash registers.

2. Security
- No policy changes — RLS already enabled with anon+authenticated CRUD.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workstations' AND column_name = 'is_cloud'
  ) THEN
    ALTER TABLE workstations ADD COLUMN is_cloud boolean NOT NULL DEFAULT false;
  END IF;
END $$;
