/*
# Remove hardcoded CHECK constraint on tokens.status

## Why
The `tokens.status` column had a CHECK constraint restricting it to 5
hardcoded lowercase values: 'присвоен', 'зарегистрирован', 'пауза',
'блокировка', 'снят с регистрации'.

The application now manages token statuses dynamically through the
`statuses` table (category = 'token'), which contains different values
(e.g. 'БЛОКИРОВКА', 'ЗАРЕГИСТРИРОВАН', 'ОТКЛЮЧЕН', 'ОФОРМЛЕН',
'СЕЗОННАЯ ПАУЗА'). The old CHECK constraint rejected these new values,
making it impossible to save new tokens.

## Changes
1. Drop the `tokens_status_check` constraint.
2. The `status` column remains `text NOT NULL DEFAULT 'присвоен'` —
   no data loss, no type change. Valid values are now enforced by the
   application via the `statuses` table, not by a database constraint.

## Security
No RLS or policy changes. No grants changed.
*/

ALTER TABLE tokens DROP CONSTRAINT IF EXISTS tokens_status_check;
