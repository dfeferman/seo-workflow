-- Einmalig auf der Production-Datenbank ausführen (nachdem der User existiert).
-- Voraussetzung: Account mit dieser E-Mail ist bereits registriert.
-- Ausführung z. B.: psql "$DATABASE_URL" -f server/db/migrations/005_grant_superadmin_feferman.sql

UPDATE users
SET is_superadmin = TRUE,
    is_approved = TRUE,
    approved_at = COALESCE(approved_at, NOW()),
    updated_at = NOW()
WHERE lower(trim(email)) = lower(trim('d.feferman@adebo-medical.de'));

-- Optional: prüfen (sollte genau eine Zeile mit is_superadmin = true zeigen)
-- SELECT id, email, is_superadmin, is_approved FROM users WHERE lower(trim(email)) = lower(trim('d.feferman@adebo-medical.de'));
