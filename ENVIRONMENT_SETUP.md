# 🌍 Environment Setup Guide

Dieses Projekt nutzt **umgebungsspezifische `.env`-Dateien** für verschiedene Zwecke (Development, Testing, Production).

## 📁 Verfügbare Environment Files

| Datei | Zweck | In Git? | Datenbank |
|-------|-------|---------|-----------|
| `.env.example` | Template für neue Entwickler | ✅ Ja | - |
| `.env.development` | Lokale Entwicklung | ❌ Nein | `ticketsystem_dev` |
| `.env.test` | Automatisierte Tests | ❌ Nein | `ticketsystem_test` |
| `.env.production` | Production-Server | ❌ Nein | `ticketsystem` (PROD) |
| `.env` | Fallback (deprecated) | ❌ Nein | - |

## 🔄 Automatisches Laden

Das System lädt **automatisch** die richtige `.env`-Datei basierend auf `NODE_ENV`:

```javascript
// Automatisch geladen in src/server/config/env.js
NODE_ENV=development → lädt .env.development
NODE_ENV=test        → lädt .env.test
NODE_ENV=production  → lädt .env.production
```

## 🚀 Verwendung

### Development

```bash
npm run start:dev
# → Lädt automatisch .env.development
# → Nutzt ticketsystem_dev Datenbank
```

### Testing

```bash
npm run test
# → Lädt automatisch .env.test
# → Nutzt ticketsystem_test Datenbank
```

### Production

```bash
npm run start
# → Lädt automatisch .env.production
# → Nutzt PROD-Datenbank
```

## 📝 Datenbank-Namen in MongoDB

In deinem MongoDB Atlas Cluster hast du jetzt **drei separate Datenbanken**:

```
mongodb+srv://...mongodb.net/ticketsystem         ← Production
mongodb+srv://...mongodb.net/ticketsystem_dev     ← Development
mongodb+srv://...mongodb.net/ticketsystem_test    ← Testing
```

**Wichtig:** Der Datenbankname wird über die Connection-String-URL angegeben:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/DATENBANKNAME
                                                         ^^^^^^^^^^^
```

## 🔧 Setup für neue Entwickler

1. **`.env.example` kopieren:**
   ```bash
   cp .env.example .env.development
   cp .env.example .env.test
   ```

2. **MongoDB URIs anpassen:**
   ```env
   # .env.development
   MONGO_URI=mongodb+srv://...@cluster.mongodb.net/ticketsystem_dev

   # .env.test
   MONGO_URI=mongodb+srv://...@cluster.mongodb.net/ticketsystem_test
   ```

3. **Google OAuth Credentials einfügen:**
   - Gleiche Credentials für dev und test
   - Callback-URL anpassen falls nötig

4. **Secrets generieren:**
   ```bash
   # SESSION_SECRET generieren
   openssl rand -hex 32

   # JWT_SECRET generieren
   openssl rand -hex 32
   ```

## 🧪 Test-Datenbank seeden

Fülle die Test-Datenbank mit Beispieldaten:

```bash
npm run seed:test
```

## ⚠️ Best Practices

### ✅ DO
- Nutze **separate Datenbanken** für dev/test/prod
- Committe **niemals** `.env`-Dateien mit echten Credentials
- Halte `.env.example` **aktuell** (ohne sensitive Daten)
- Nutze **starke Secrets** in Production

### ❌ DON'T
- Nutze **nicht** die Production-DB für Tests!
- Teile **keine** Secrets in Slack/Email
- Verwende **keine** schwachen Passwörter
- Committe **keine** `.env.*` Dateien (außer `.env.example`)

## 🔐 Sicherheit

Alle `.env.*` Dateien (außer `.env.example`) sind in `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
.env.development
.env.test
.env.production

# Keep .env.example in git
!.env.example
```

## 🐛 Troubleshooting

### Problem: "No .env file found"

**Lösung:** Stelle sicher, dass die `.env.{NODE_ENV}` Datei existiert:

```bash
ls -la .env*
```

### Problem: "Connecting to wrong database"

**Lösung:** Prüfe `NODE_ENV` in deinem Terminal:

```bash
echo $NODE_ENV  # Linux/Mac
echo %NODE_ENV% # Windows CMD
$env:NODE_ENV   # Windows PowerShell
```

### Problem: "Tests nutzen Production-DB"

**Lösung:** Stelle sicher, dass die Test-Scripts `NODE_ENV=test` setzen:

```json
{
  "scripts": {
    "test": "set NODE_ENV=test && vitest --run"
  }
}
```

## 📚 Weitere Informationen

- [dotenv Documentation](https://www.npmjs.com/package/dotenv)
- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Node.js Environment Variables](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

---

**Tipp:** Du kannst jederzeit `.env.example` ansehen, um zu sehen, welche Variablen benötigt werden.

---

## 🔧 Technische Implementierung

Dieser Abschnitt dokumentiert die technischen Änderungen, die für das Environment-Management-System vorgenommen wurden.

### 📄 Neu erstellte Dateien

#### 1. Environment-Dateien

| Datei | Zweck | Wichtige Unterschiede |
|-------|-------|----------------------|
| `.env.example` | Template ohne Credentials | Wird in Git committed |
| `.env.development` | Dev-Umgebung | DB: `ticketsystem_dev` |
| `.env.test` | Test-Umgebung | DB: `ticketsystem_test`, `NODE_ENV=test` |
| `.env.production` | Prod-Umgebung | DB: `ticketsystem`, `NODE_ENV=production` |

**Beispiel-Struktur:**
```env
# .env.development
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/ticketsystem_dev?...
NODE_ENV=development

# .env.test
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/ticketsystem_test?...
NODE_ENV=test

# .env.production
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/ticketsystem?...
NODE_ENV=production
```

#### 2. Environment Loader Utility

**Datei:** [`src/server/config/env.js`](src/server/config/env.js)

Diese Utility-Datei lädt automatisch die richtige `.env`-Datei basierend auf `NODE_ENV`:

```javascript
/**
 * Environment Configuration Loader
 * Lädt automatisch die richtige .env-Datei basierend auf NODE_ENV
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

export function loadEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Versuche zuerst die spezifische .env-Datei zu laden
  const envFile = resolve(projectRoot, `.env.${nodeEnv}`);
  const fallbackEnvFile = resolve(projectRoot, '.env');

  if (existsSync(envFile)) {
    console.log(`📝 Loading environment from: .env.${nodeEnv}`);
    dotenv.config({ path: envFile });
  } else if (existsSync(fallbackEnvFile)) {
    console.log(`📝 Loading environment from: .env (fallback)`);
    dotenv.config({ path: fallbackEnvFile });
  }
  // ...
}
```

**Funktionsweise:**
1. Liest `NODE_ENV` aus der Umgebung (gesetzt durch npm scripts)
2. Sucht nach `.env.{NODE_ENV}` (z.B. `.env.test`)
3. Falls nicht gefunden, nutzt `.env` als Fallback
4. Lädt die Variablen in `process.env`

### 🔄 Geänderte Dateien

#### 1. Server Entry Point

**Datei:** [`src/server/index.js`](src/server/index.js#L6)

**Vorher:**
```javascript
import 'dotenv/config';
```

**Nachher:**
```javascript
import './config/env.js'; // Lädt automatisch die richtige .env-Datei
```

**Grund:** Statt `dotenv` direkt zu verwenden, nutzen wir unsere Custom-Utility, die die richtige `.env`-Datei basierend auf `NODE_ENV` lädt.

---

#### 2. NPM Scripts

**Datei:** [`package.json`](package.json#L6-L19)

**Vorher:**
```json
{
  "scripts": {
    "start": "node src/server/index.js",
    "start:dev": "node src/server/index.js",
    "test": "vitest --run",
    "seed": "node src/server/seed.mjs"
  }
}
```

**Nachher:**
```json
{
  "scripts": {
    "start": "set NODE_ENV=production && node src/server/index.js",
    "start:dev": "set NODE_ENV=development && node src/server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run start:dev\"",
    "test": "set NODE_ENV=test && vitest --run",
    "test:watch": "set NODE_ENV=test && vitest",
    "test:coverage": "set NODE_ENV=test && vitest --coverage",
    "seed": "set NODE_ENV=development && node src/server/seed.mjs",
    "seed:test": "set NODE_ENV=test && node src/server/seed.mjs"
  }
}
```

**Änderungen im Detail:**

| Script | Vorher | Nachher | Effekt |
|--------|--------|---------|--------|
| `start` | `node ...` | `set NODE_ENV=production && node ...` | Lädt `.env.production` |
| `start:dev` | `node ...` | `set NODE_ENV=development && node ...` | Lädt `.env.development` |
| `test` | `vitest --run` | `set NODE_ENV=test && vitest --run` | Lädt `.env.test` |
| `seed:test` | *(neu)* | `set NODE_ENV=test && node seed.mjs` | Seeds Test-DB |

**Hinweis für Linux/Mac:** Ändere `set` zu `export`:
```json
"start:dev": "export NODE_ENV=development && node src/server/index.js"
```

---

#### 3. Git Ignore

**Datei:** [`.gitignore`](.gitignore#L28-L37)

**Vorher:**
```gitignore
# Local environment files
.env
.env.local
.env.*.local
```

**Nachher:**
```gitignore
# Local environment files
.env
.env.local
.env.*.local
.env.development
.env.test
.env.production

# Keep .env.example in git
!.env.example
```

**Grund:** Verhindert, dass sensitive Environment-Dateien in Git committed werden, während `.env.example` als Template verfügbar bleibt.

---

### 🔄 Ablauf beim Starten

```mermaid
graph TD
    A[npm run start:dev] --> B[set NODE_ENV=development]
    B --> C[node src/server/index.js]
    C --> D[import ./config/env.js]
    D --> E{.env.development existiert?}
    E -->|Ja| F[Lade .env.development]
    E -->|Nein| G[Lade .env als Fallback]
    F --> H[process.env.MONGO_URI gesetzt]
    G --> H
    H --> I[Server startet mit Dev-DB]
```

### 🎯 Vorteile dieser Implementierung

| Vorteil | Beschreibung |
|---------|--------------|
| **Automatisch** | Kein manuelles Umbenennen von `.env`-Dateien mehr |
| **Sicher** | Separate DBs für Test/Dev/Prod → Keine versehentlichen Löschungen |
| **Team-freundlich** | `.env.example` zeigt neue Entwickler, was sie brauchen |
| **Test-sicher** | Tests nutzen automatisch Test-DB durch `NODE_ENV=test` |
| **Fehler-resistent** | Fallback auf `.env` falls spezifische Datei fehlt |
| **Transparent** | Console-Logs zeigen, welche `.env` geladen wurde |

### 📊 Environment-Variablen-Hierarchie

Die Reihenfolge, in der Environment-Variablen geladen werden:

1. **System-Environment-Variablen** (z.B. durch Azure/Heroku gesetzt)
2. **`.env.{NODE_ENV}`** (spezifisch für die Umgebung)
3. **`.env`** (Fallback, deprecated)

**Beispiel:**
```bash
# Wenn Azure PORT=8080 setzt, überschreibt es die .env
process.env.PORT = 8080  # von Azure
process.env.MONGO_URI = "..."  # von .env.production
```

### 🔍 Debugging

Um zu sehen, welche `.env` geladen wurde:

```bash
npm run start:dev
# Output:
# 📝 Loading environment from: .env.development
# === Server Configuration ===
# Environment: development
# ✓ MongoDB connected to ticketsystem_dev
```

### 🧪 Testing der Implementierung

**1. Testen, ob richtige .env geladen wird:**
```bash
npm run start:dev
# Sollte zeigen: "Loading environment from: .env.development"
```

**2. Testen, ob Test-DB genutzt wird:**
```bash
npm run test
# Sollte zeigen: "Loading environment from: .env.test"
```

**3. Prüfen, welche Datenbank verbunden ist:**
```javascript
// In src/server/index.js hinzufügen (temporär):
console.log('Connected to database:', process.env.MONGO_URI.split('/')[3].split('?')[0]);
// Output: "ticketsystem_dev" oder "ticketsystem_test"
```

### 📝 Wartung

**Neue Environment-Variable hinzufügen:**
1. In `.env.example` hinzufügen (ohne Wert)
2. In `.env.development`, `.env.test`, `.env.production` mit Werten hinzufügen
3. Dokumentation aktualisieren

**Beispiel:**
```env
# .env.example
NEW_API_KEY=your-api-key-here

# .env.development
NEW_API_KEY=dev-key-123

# .env.test
NEW_API_KEY=test-key-456

# .env.production
NEW_API_KEY=prod-key-xyz
```

---

## 📌 Zusammenfassung der Änderungen

**6 neue Dateien:**
- `.env.example`, `.env.development`, `.env.test`, `.env.production`
- `src/server/config/env.js`
- `ENVIRONMENT_SETUP.md`

**3 geänderte Dateien:**
- `src/server/index.js` → Nutzt neue env.js
- `package.json` → Scripts setzen NODE_ENV
- `.gitignore` → Ignoriert .env-Dateien

**Ergebnis:** Automatisches, sicheres Environment-Management mit separaten Datenbanken für jede Umgebung! 🎉
