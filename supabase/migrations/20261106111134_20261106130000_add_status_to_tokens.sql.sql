ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'присвоен'
  CHECK (status IN ('присвоен', 'зарегистрирован', 'пауза', 'блокировка', 'снят с регистрации'));
