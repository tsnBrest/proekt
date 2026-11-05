/*
# Add BIK column to banks

1. Changes
- Adds `bik` (text) column to `banks` table — bank identification code (БИК), optional.
- Default empty string so existing rows are unaffected.

2. Security
- No policy or grant changes needed: the column inherits the existing RLS policies on `banks`.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banks' AND column_name = 'bik') THEN
    ALTER TABLE banks ADD COLUMN bik text NOT NULL DEFAULT '';
  END IF;
END $$;
