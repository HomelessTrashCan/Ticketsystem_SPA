# CI/CD Pipeline

Diese Anwendung verwendet GitHub Actions für Continuous Integration und Continuous Deployment.

## Workflows

### 1. CI/CD Workflow (`ci-cd.yml`)

**Trigger:** Push und Pull Requests auf den `develop` Branch

**Was passiert:**
1. ✅ **MongoDB Service** wird als Container gestartet (MongoDB 7)
2. ✅ **Node.js 20** wird installiert
3. ✅ **Dependencies** werden installiert (`npm ci`)
4. ✅ **Datenbank** wird mit Seed-Daten gefüllt (`npm run seed`)
5. ✅ **Backend Server** startet im Hintergrund (Port 8080)
6. ✅ **Tests** werden ausgeführt (Unit + Integration Tests)
7. ✅ **Build** wird erstellt (`npm run build`)
8. ✅ **Artifacts** werden hochgeladen (dist-Ordner)

**Umgebungsvariablen:**
- `MONGO_URI`: `mongodb://testuser:testpass@localhost:27017/?authSource=admin`
- `GOOGLE_CLIENT_ID`: Mock-Wert für Tests
- `GOOGLE_CLIENT_SECRET`: Mock-Wert für Tests
- `SESSION_SECRET`: Test-Secret für Sessions
- `JWT_SECRET`: Test-Secret für JWT-Token
- `FRONTEND_URL`: `http://localhost:5173`

**Services:**
- MongoDB Container läuft auf Port 27017
- Health Checks stellen sicher, dass MongoDB bereit ist
- Backend Server startet automatisch und wird nach Tests gestoppt

---

### 2. Azure Deployment Workflow (`azure-webapps-node.yml`)

**Trigger:** Push auf `develop` Branch oder manuell via `workflow_dispatch`

**Was passiert:**

#### Build Job:
1. ✅ Node.js 20 Setup
2. ✅ Dependencies installieren
3. ✅ Build erstellen
4. ⚠️ Tests übersprungen (benötigen MongoDB - laufen im CI-Workflow)
5. ✅ Dev-Dependencies entfernen (`npm prune --production`)
6. ✅ Artifact hochladen

#### Deploy Job:
1. ✅ Artifact herunterladen
2. ✅ Deployment zu Azure Web App
3. ✅ MONGO_URI wird aus Azure App Service Configuration gelesen

---

## Konfiguration

### GitHub Secrets

Für Azure Deployment werden folgende Secrets benötigt:

| Secret Name | Beschreibung | Wo zu finden |
|------------|--------------|--------------|
| `AZURE_WEBAPP_NAME` | Name der Azure Web App | Azure Portal -> Web App Name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Publish Profile XML | Azure Portal -> Web App -> Download publish profile |

**Secrets hinzufügen:**
1. GitHub Repository → Settings → Secrets and variables → Actions
2. "New repository secret" klicken
3. Name und Wert eingeben

### Azure App Service Configuration

⚠️ **WICHTIG:** Nach dem Deployment müssen alle Environment Variables in Azure konfiguriert werden!

Die folgenden Umgebungsvariablen müssen in Azure konfiguriert werden:

1. **Azure Portal öffnen**
2. Zu Ihrer Web App navigieren
3. **Configuration** → **Application settings**
4. **New application setting** für jede Variable klicken
5. Folgende Settings hinzufügen:

| Name | Beschreibung | Beispiel |
|------|--------------|----------|
| `MONGO_URI` | MongoDB Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=App` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Aus Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Aus Google Cloud Console |
| `SESSION_SECRET` | Session Encryption Key | Zufälliger String (min. 32 Zeichen) |
| `JWT_SECRET` | JWT Token Encryption Key | Zufälliger String (min. 32 Zeichen) |
| `FRONTEND_URL` | URL der deployed App | `https://ihre-app.azurewebsites.net` |

6. **Save** klicken
7. Web App wird automatisch neu gestartet

#### Secrets generieren:

```powershell
# PowerShell: Zufällige Secrets generieren
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### Google OAuth Client konfigurieren:

1. **Google Cloud Console** öffnen: https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. **OAuth Client ID** auswählen oder neu erstellen
4. **Application type:** Web application
5. **Authorized redirect URIs** - **BEIDE URLs** eintragen:
   - `http://localhost:8080/api/auth/google/callback` (für lokale Entwicklung)
   - `https://ihre-app.azurewebsites.net/api/auth/google/callback` (für Production)
6. Client ID und Secret kopieren → in Azure App Settings einfügen

> ⚠️ **Wichtig:** Beide URLs müssen eingetragen sein, damit OAuth sowohl lokal als auch in Production funktioniert!

---

## Lokale Entwicklung

### Environment Variables Setup

Erstellen Sie eine `.env` Datei im Projekt-Root (nur für **lokale Entwicklung**):

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=TicketSystem

# Google OAuth
GOOGLE_CLIENT_ID=ihre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ihr-secret

# Callback URL für lokale Entwicklung
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# Session & JWT Secrets
SESSION_SECRET=ihr-session-secret-min-32-zeichen
JWT_SECRET=ihr-jwt-secret-min-32-zeichen

# Server Config
PORT=8080
NODE_ENV=development

# Frontend URL für lokale Entwicklung
FRONTEND_URL=http://localhost:5174
```

> ⚠️ **Wichtig:** Für Production werden die Umgebungsvariablen in Azure App Service gesetzt (siehe oben), nicht in einer `.env` Datei!
> Die Production-Werte für `GOOGLE_CALLBACK_URL` und `FRONTEND_URL` müssen die Azure-URL verwenden!

### Tests lokal ausführen

**Voraussetzungen:**
1. MongoDB Server muss laufen (oder Atlas URI verwenden)
2. Backend Server muss laufen

```powershell
# Terminal 1: Backend starten (stellen Sie sicher, dass .env Datei existiert)
node src\server\index.js

# Terminal 2: Tests ausführen
npm test

# Oder mit Watch-Modus:
npm run test:watch
```

### Build lokal erstellen

```powershell
npm run build
```

Build-Output landet in `dist/`

---

## Troubleshooting

### CI-Tests schlagen fehl

**Problem:** MongoDB Service nicht bereit
- **Lösung:** Health Checks in `ci-cd.yml` prüfen Verbindung

**Problem:** Backend Server startet nicht
- **Lösung:** Logs in GitHub Actions prüfen, `Wait for server` Step erhöht Timeout

**Problem:** Tests schlagen fehl
- **Lösung:** Lokale Tests ausführen, um Problem zu isolieren

### Azure Deployment schlägt fehl

**Problem:** `AZURE_WEBAPP_PUBLISH_PROFILE` Secret fehlt
- **Lösung:** Secret in GitHub Repository Settings hinzufügen

**Problem:** App startet nicht nach Deployment
- **Lösung:** 
  1. `MONGO_URI` in Azure App Service Configuration prüfen
  2. Application Insights Logs in Azure prüfen
  3. `npm start` Script in package.json prüfen

**Problem:** MongoDB-Verbindung schlägt fehl
- **Lösung:**
  1. MongoDB Atlas Network Access prüfen (0.0.0.0/0 erlauben für Azure)
  2. Verbindungsstring in Azure Configuration prüfen
  3. MongoDB Atlas User Credentials prüfen

---

## Best Practices

### Branch-Strategie
- `develop`: Entwicklung und Tests
- `main`: Produktions-Deployment (konfigurieren Sie separate Workflow)

### Testing
- ✅ Unit Tests laufen bei jedem Push
- ✅ Integration Tests laufen gegen echte MongoDB
- ✅ Test-Daten werden automatisch bereinigt
- ⚠️ Deployment-Workflow überspringt Tests (laufen separat in CI)

### Secrets Management
- ❌ Niemals Secrets im Code committen
- ✅ GitHub Secrets für CI/CD verwenden
- ✅ Azure App Configuration für Production-Umgebung

### Monitoring
- Azure Application Insights aktivieren
- GitHub Actions Logs regelmäßig prüfen
- MongoDB Atlas Monitoring nutzen

---

## Weitere Informationen

- [GitHub Actions Dokumentation](https://docs.github.com/en/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [Vitest Dokumentation](https://vitest.dev/)
