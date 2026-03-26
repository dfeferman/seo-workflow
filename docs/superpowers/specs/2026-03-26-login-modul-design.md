# Login-Modul Design

> **Entstehung:** Skill: superpowers:brainstorming

## Scope

Kern-Flow (Stufe A): Login, Signup, Forgot/Reset Password, Passwort-Toggle, Redirect nach Login.
Kein RBAC, kein Device-Management, kein "Angemeldet bleiben".
Backend: eigenes Node.js/Express + PostgreSQL (kein Supabase).

---

## 1. Datenbank

### Neue Tabelle: `password_reset_tokens`

Migration: `server/db/migrations/002_password_reset.sql`

```sql
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);
```

- Token wird als SHA-256-Hash gespeichert, nie im Klartext
- TTL: 1 Stunde
- Einmalige Nutzung: `used_at` wird beim Einlösen gesetzt

### Neue Tabelle: `refresh_tokens`

Migration: ebenfalls in `002_password_reset.sql`

```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_rt_user_id ON refresh_tokens(user_id);
```

- Refresh-Token als 32-Byte-Zufallsstring (crypto.randomBytes), gehasht gespeichert
- TTL: 7 Tage
- Beim Logout wird der Eintrag gelöscht

**Keine Änderung** an der bestehenden `users`-Tabelle.

---

## 2. Backend API

### Geänderte Endpoints

| Method | Route | Änderung |
|--------|-------|----------|
| `POST` | `/api/auth/login` | Gibt zusätzlich Refresh-Token als `httpOnly`-Cookie zurück; Access-Token-Laufzeit: 15 min |
| `POST` | `/api/auth/register` | Wie Login — gibt Access-Token + setzt Refresh-Token-Cookie |

### Neue Endpoints

| Method | Route | Beschreibung |
|--------|-------|-------------|
| `POST` | `/api/auth/refresh` | Liest Refresh-Token aus Cookie, gibt neuen Access-Token zurück |
| `POST` | `/api/auth/logout` | Löscht Refresh-Token aus DB, löscht Cookie |
| `POST` | `/api/auth/forgot-password` | Erzeugt Reset-Token, ruft E-Mail-Service auf |
| `POST` | `/api/auth/reset-password` | Validiert Token, setzt neues Passwort, markiert Token als genutzt |

### Token-Strategie

- **Access Token**: JWT, 15 Minuten, im Response Body zurückgegeben
- **Refresh Token**: opaker 32-Byte-String, 7 Tage, Cookie-Flags: `httpOnly; Secure; SameSite=Strict`
- Bei 401 im Frontend: automatisch `/api/auth/refresh` aufrufen, dann Original-Request wiederholen

### E-Mail-Service

Abstraktes Interface:

```ts
interface EmailService {
  sendPasswordReset(to: string, resetUrl: string): Promise<void>
}
```

Platzhalter-Implementierung loggt `resetUrl` zur Konsole. Leicht gegen Resend/Nodemailer austauschbar durch Dependency Injection in den Route-Handler.

### Sicherheitsregeln

- `forgot-password` gibt immer dieselbe generische Antwort zurück (kein Hinweis, ob E-Mail bekannt)
- Passwort-Mindestlänge: 8 Zeichen (bereits vorhanden, bleibt)
- bcrypt mit 10 Rounds (bereits vorhanden, bleibt)

---

## 3. Frontend

### Neue Routen

| Route | Datei | Beschreibung |
|-------|-------|-------------|
| `/forgot-password` | `src/routes/forgot-password.tsx` | E-Mail-Eingabe; zeigt Bestätigungsstate nach Absenden |
| `/reset-password` | `src/routes/reset-password.tsx` | Liest `token` aus Search-Param; neues Passwort + Bestätigung |

### Geänderte Dateien

**`src/routes/__root.tsx`**
- `/forgot-password` und `/reset-password` zu `isPublicPage` hinzufügen
- `<Navigate to="/login" />` wird zu `<Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} />`

**`src/routes/login.tsx`**
- Link "Passwort vergessen?" unterhalb des Passwort-Felds
- Passwort-Toggle (Auge-Icon, `type="password"` ↔ `type="text"`)
- Nach erfolgreichem Login: Redirect auf `redirect`-Searchparam falls vorhanden, sonst `/`

**`src/routes/signup.tsx`**
- Passwort-Toggle

**`src/components/AuthProvider.tsx`** — kompletter Umbau:
- Access Token nur noch im React State (`useState<string | null>`)
- Kein `localStorage` mehr
- Beim App-Start: `POST /api/auth/refresh` aufrufen → bei Erfolg Access-Token in State setzen, User laden; bei Fehler → stiller Logout
- `signOut` ruft `POST /api/auth/logout` auf

**`src/lib/apiClient.ts`**
- `setToken`/`clearToken` bleiben als Setter für den In-Memory-Token (Modul-Level-Variable, kein `localStorage`)
- `AuthProvider` ruft `setToken(token)` nach Login/Refresh auf und `clearToken()` beim Logout
- Interceptor: bei 401-Response automatisch `POST /api/auth/refresh` aufrufen, neuen Token via `setToken` setzen, dann Original-Request einmalig wiederholen. Bei erneutem 401 → `clearToken()` + Event auslösen, damit `AuthProvider` den User-State leert

### Redirect-Flow nach Login

Geschützte Routen leiten via `/login?redirect=/ursprüngliche/seite` weiter.
Nach erfolgreichem Login navigiert der Client zu `redirect` (Whitelist: nur interne Pfade, `/` als Fallback).

---

## 4. Fehlerbehandlung

| Szenario | Verhalten |
|----------|-----------|
| `forgot-password` mit unbekannter E-Mail | Immer: "Falls die E-Mail registriert ist, erhältst du einen Link" |
| Reset-Token abgelaufen | Klare Meldung + Link zurück zu `/forgot-password` |
| Reset-Token bereits genutzt | Wie abgelaufen |
| Refresh beim App-Start schlägt fehl | Stiller Logout, kein Error-Dialog |
| 401 nach Retry-Versuch | `signOut()` aufrufen, Redirect auf `/login` |

---

## 5. Tests (Backend)

Erweiterung von `server/tests/auth.test.ts`:

- `POST /forgot-password`
  - bekannte E-Mail → 200 + generische Nachricht
  - unbekannte E-Mail → 200 + gleiche generische Nachricht
- `POST /reset-password`
  - gültiger Token → 200, Passwort geändert
  - abgelaufener Token → 400
  - bereits genutzter Token → 400
  - Token-Replay nach Nutzung → 400
- `POST /refresh`
  - gültiger Cookie → 200 + neuer Access-Token
  - kein Cookie → 401
  - abgelaufener Refresh-Token → 401
- `POST /logout`
  - Token wird aus DB gelöscht, Cookie wird geleert

Frontend-Tests: kein neues Test-Setup (keine bestehenden Frontend-Tests im Projekt).

---

## 6. Dateiübersicht

```
server/
  db/migrations/
    002_password_reset.sql          ← neu
  routes/
    auth.ts                         ← erweitert
  services/
    email.ts                        ← neu (Interface + Platzhalter)

src/
  routes/
    forgot-password.tsx             ← neu
    reset-password.tsx              ← neu
    login.tsx                       ← erweitert
    signup.tsx                      ← erweitert
    __root.tsx                      ← erweitert
  components/
    AuthProvider.tsx                ← umbau
  lib/
    apiClient.ts                    ← erweitert
```
