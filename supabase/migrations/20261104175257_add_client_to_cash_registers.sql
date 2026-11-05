/*
# Link cash registers to clients

1. Modified Tables
- `equipment` (cash register register)
  - New column `client_id` (uuid, optional) - the client the cash register belongs to, referencing `clients.id`.
  - Index on `client_id` for fast lookup of a client's cash registers.

2. Notes
- Existing cash register records are kept unchanged; their `client_id` stays empty until assigned.
- If a client is deleted, the link on its cash registers is cleared (the cash registers themselves are kept).
- The migration is idempotent and safe to re-run.

3. Security
- No change to access policies or grants.
*/

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS equipment_client_id_idx ON equipment (client_id);
