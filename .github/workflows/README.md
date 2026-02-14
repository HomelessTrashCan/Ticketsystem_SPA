# CI/CD Pipeline Dokumentation

## Übersicht

Die CI/CD Pipeline automatisiert Testing, Build und Deployment der Ticketsystem-Anwendung zu Azure Web App Service.

## Pipeline-Ablauf

```
┌─────────────────────────────────────────────────────────┐
│                    Push to 'develop'                    │
│                 oder Workflow Dispatch                  │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐            ┌──────────────────┐
│  Unit Tests  │            │ Integration Tests│
│              │            │  (mit MongoDB)   │
│ • agents.ts  │            │ • app.test.ts    │
│ • Kein DB    │            │ • tickets.test.ts│
└──────┬───────┘            └─────────┬────────┘
       │                              │
       └──────────────┬───────────────┘
                      │ (beide müssen erfolgreich sein)
                      ▼
              ┌───────────────┐
              │     Build     │
              │               │
              │ • npm ci      │
              │ • npm build   │
              │ • prune deps  │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │    Deploy     │
              │               │
              │ Azure WebApp  │
              └───────┬───────┘
                      │ (wartet 30 Sek)
                      ▼
              ┌───────────────┐
              │  Smoke Tests  │
              │               │
              │ • /health     │
              │ • /           │
              │ • /api/agents │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  Load Tests   │
              │     (k6)      │
              │               │
              │ Optional/     │
              │ Manual only   │
              └───────────────┘
```

## Jobs im Detail

### 1. Unit Tests

**Zweck:** Schnelle Tests ohne externe Abhängigkeiten

**Läuft auf:** Ubuntu Latest  
**Dauer:** ~10-30 Sekunden  
**Benötigt:** Node.js 20

**Was wird getestet:**
- `tests/units/agents.test.ts`
- Pure Funktionen
- Business Logic
- Keine Datenbank erforderlich

**Beispiel:**
```bash
npm test tests/units/
```

**Fehlschlägt wenn:**
- Syntax-Fehler im Code
- Unit-Tests schlagen fehl
- npm install schlägt fehl

---

### 2. Integration Tests

**Zweck:** End-to-End Tests mit echter MongoDB

**Läuft auf:** Ubuntu Latest mit MongoDB Service Container  
**Dauer:** ~30-60 Sekunden  
**Benötigt:** 
- Node.js 20
- MongoDB 7 (Container)

**MongoDB Container:**
```yaml
services:
  mongodb:
    image: mongo:7
    env:
      MONGO_INITDB_ROOT_USERNAME: testuser
      MONGO_INITDB_ROOT_PASSWORD: testpass
    ports:
      - 27017:27017
```

**Was wird getestet:**
- `tests/integrations/app.test.ts`
- `tests/integrations/tickets.test.ts`
- API-Endpoints mit echter DB
- HTTP-Requests mit supertest

**Environment Variables:**
```bash
MONGO_URI=mongodb://testuser:testpass@localhost:27017/test?authSource=admin
SESSION_SECRET=test-secret-for-ci-only
JWT_SECRET=test-jwt-secret-for-ci-only
NODE_ENV=test
```

**Beispiel:**
```bash
npm test tests/integrations/
```

**Fehlschlägt wenn:**
- MongoDB Verbindung schlägt fehl
- API-Endpoints geben falsche Status Codes
- Datenbank-Operationen fehlschlagen

---

### 3. Build

**Zweck:** Anwendung kompilieren und für Deployment vorbereiten

**Läuft auf:** Ubuntu Latest  
**Dauer:** ~1-2 Minuten  
**Abhängig von:** Unit Tests + Integration Tests (beide müssen erfolgreich sein)

**Schritte:**
1. **Dependencies installieren**
   ```bash
   npm ci
   ```

2. **TypeScript kompilieren & Vite Build**
   ```bash
   npm run build
   ```
   - Erstellt `/dist` Ordner mit Frontend
   - Kompiliert TypeScript zu JavaScript

3. **dist-Ordner verifizieren**
   ```bash
   ls -la dist/
   # Muss index.html und assets/ enthalten
   ```

4. **Dev-Dependencies entfernen**
   ```bash
   npm prune --production
   ```
   - Reduziert Artifact-Größe um ~70%
   - Entfernt TypeScript, Vite, Testing-Tools

5. **Artifact hochladen**
   - Hochladen des kompletten Projekts (ohne node_modules dev deps)
   - Wird im nächsten Job verwendet

**Fehlschlägt wenn:**
- Build-Fehler (TypeScript, Vite)
- dist-Ordner nicht erstellt
- npm ci schlägt fehl

---

### 4. Deploy

**Zweck:** Deployment zu Azure Web App Service

**Läuft auf:** Ubuntu Latest  
**Dauer:** ~2-5 Minuten  
**Abhängig von:** Build Job  
**Environment:** Development

**Schritte:**

1. **Artifact herunterladen**
   ```bash
   # Lädt node-app artifact vom Build-Job
   ```

2. **Package verifizieren**
   - Prüft ob package.json vorhanden
   - Prüft ob web.config vorhanden
   - Prüft ob dist/ vorhanden
   - Prüft ob src/server/index.js vorhanden

3. **Publish Profile validieren**
   ```bash
   # Prüft ob Secret gesetzt ist
   ```

4. **Deploy zu Azure**
   ```yaml
   uses: azure/webapps-deploy@v3
   with:
     app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
     publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
     package: ./
   ```

**Benötigte Secrets:**
- `AZURE_WEBAPP_NAME` - Name der Azure Web App
- `AZURE_WEBAPP_PUBLISH_PROFILE` - Download vom Azure Portal

**Azure App Settings (manuell konfigurieren):**
```
MONGO_URI=mongodb+srv://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://your-app.azurewebsites.net
NODE_ENV=production
```

**Fehlschlägt wenn:**
- Secrets nicht konfiguriert
- Azure Deployment schlägt fehl
- Kritische Dateien fehlen

---

### 5. Smoke Tests

**Zweck:** Schnelle Validierung nach Deployment

**Läuft auf:** Ubuntu Latest  
**Dauer:** ~30-45 Sekunden  
**Abhängig von:** Deploy Job

**Wartezeit:** 30 Sekunden nach Deploy (App-Stabilisierung)

**Tests:**

1. **Health Endpoint**
   ```bash
   curl https://your-app.azurewebsites.net/health
   # Erwartet: 200 OK
   ```

2. **Homepage**
   ```bash
   curl https://your-app.azurewebsites.net/
   # Erwartet: 200 OK (React App)
   ```

3. **API Endpoint**
   ```bash
   curl https://your-app.azurewebsites.net/api/agents
   # Erwartet: 200 oder 401
   ```

**Fehlschlägt wenn:**
- Endpoints nicht erreichbar (404, 500, 503)
- App nicht gestartet
- Timeout nach 30 Sekunden

---

### 6. Load Tests (k6)

**Zweck:** Performance-Test unter Last

**Läuft auf:** Ubuntu Latest  
**Dauer:** ~2-5 Minuten (abhängig von Test-Config)  
**Abhängig von:** Smoke Tests  
**Optional:** Läuft nur bei workflow_dispatch oder main branch

**Konfiguration:**
```javascript
// tests/k6.test.js
stages: [
  { duration: '30s', target: 50 },   // Ramp-up zu 50 VUs
  { duration: '1m', target: 50 },    // Halte 50 VUs
  { duration: '30s', target: 0 },    // Ramp-down
]
```

**Installation:**
```bash
# k6 auf Ubuntu installieren
sudo apt-get install k6
```

**Ausführung:**
```bash
k6 run tests/k6.test.js \
  --vus 50 \
  --duration 2m \
  --out json=k6-results.json
```

**Metriken:**
- HTTP Request Duration
- Request Rate
- Error Rate
- P95, P99 Response Times

**Besonderheit:**
```yaml
continue-on-error: true
```
- Pipeline schlägt **nicht** fehl wenn Thresholds nicht erreicht
- Nur Warning in Logs
- Ergebnisse werden als Artifact gespeichert

**Fehlschlägt wenn:**
- k6 Installation schlägt fehl
- Test-Script hat Syntax-Fehler

---

## Artifact-Handling

### Erstellte Artifacts

| Artifact Name | Job | Inhalt | Verwendung |
|---------------|-----|--------|------------|
| `unit-test-results` | unit-tests | Test-Berichte | Debug bei Fehlern |
| `integration-test-results` | integration-tests | Test-Berichte | Debug bei Fehlern |
| `node-app` | build | Komplettes Projekt (gebuildet) | Deployment |
| `k6-load-test-results` | load-tests | k6 JSON Ergebnisse | Performance-Analyse |

### Artifact-Größe optimieren

**Vor `npm prune --production`:** ~500 MB  
**Nach `npm prune --production`:** ~150 MB

**Entfernte Dev-Dependencies:**
- TypeScript, ts-node
- Vite, ESBuild
- Vitest, Testing Libraries
- ESLint, Prettier
- @types/* packages

---

## Secrets & Environment Variables

### GitHub Secrets (erforderlich)

Unter: **Settings → Secrets and variables → Actions**

| Secret Name | Beschreibung | Wo zu bekommen |
|-------------|--------------|----------------|
| `AZURE_WEBAPP_NAME` | Name deiner Azure Web App | Azure Portal |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Deployment-Credentials | Azure Portal → Download Publish Profile |

### Azure App Settings (manuell)

Unter: **Azure Portal → Web App → Configuration → Application Settings**

| Setting | Beispiel | Zweck |
|---------|----------|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/...` | Datenbank-Verbindung |
| `SESSION_SECRET` | Random String (32+ chars) | Express Session |
| `JWT_SECRET` | Random String (32+ chars) | JWT Token Signing |
| `GOOGLE_CLIENT_ID` | `123456789.apps.googleusercontent.com` | OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | OAuth |
| `FRONTEND_URL` | `https://your-app.azurewebsites.net` | CORS |
| `NODE_ENV` | `production` | Environment |

---

## Branch-Strategie

### Trigger

```yaml
on:
  push:
    branches: [ "develop" ]
  workflow_dispatch:
```

**Push zu `develop`:**
- Vollständige Pipeline läuft automatisch
- Inklusive Unit Tests, Integration Tests, Build, Deploy, Smoke Tests
- **Ohne** k6 Load Tests (nur Main/Manual)

**Workflow Dispatch (Manuell):**
- Über GitHub UI: Actions → Workflow → Run workflow
- Läuft alle Jobs inklusive k6 Load Tests
- Nützlich für Testing ohne Code-Push

**Main Branch:**
- Bei Push zu `main`: Alle Jobs inklusive k6
- Empfohlen für Production-Deployments

---

## Job-Dependencies Visualisierung

```mermaid
graph TD
    A[Push/Dispatch] --> B[Unit Tests]
    A --> C[Integration Tests]
    B --> D[Build]
    C --> D
    D --> E[Deploy]
    E --> F[Smoke Tests]
    F --> G[Load Tests k6]
    
    style A fill:#e1f5ff
    style B fill:#fff3cd
    style C fill:#fff3cd
    style D fill:#d1ecf1
    style E fill:#f8d7da
    style F fill:#d4edda
    style G fill:#e2e3e5
```

---

## Fehlerbehandlung

### Unit/Integration Tests schlagen fehl

**Symptom:** Build Job wird übersprungen

**Lösung:**
1. Logs vom Test-Job prüfen
2. Tests lokal ausführen: `npm test`
3. Fehler beheben und erneut pushen

---

### Build schlägt fehl

**Symptom:** Deploy Job wird übersprungen

**Lösung:**
1. TypeScript-Fehler prüfen: `npm run build`
2. Logs im Build-Job analysieren
3. Stelle sicher dass dist/ erstellt wird

---

### Deploy schlägt fehl

**Symptom:** "Secrets not found" oder Azure Error

**Lösung:**
1. Prüfe GitHub Secrets
2. Lade neues Publish Profile herunter
3. Prüfe Azure App Service Status im Portal

---

### Smoke Tests schlagen fehl

**Symptom:** App deployed aber nicht erreichbar

**Lösung:**
1. Prüfe Azure Portal Logs (Log Stream)
2. Prüfe App Settings (MONGO_URI, etc.)
3. Prüfe Application Insights
4. Cold Start Problem? → Warte 1-2 Minuten

---

### k6 Load Tests "schlagen fehl"

**Symptom:** Test läuft aber zeigt Fehler

**Hinweis:** Das ist oft OK!

```yaml
continue-on-error: true
```

**Erklärung:**
- k6 schlägt "fehl" wenn Thresholds nicht erreicht
- Z.B. p(95) > 500ms
- Pipeline läuft trotzdem weiter
- Prüfe k6-results.json Artifact für Details

---

## Performance-Optimierungen

### Cache nutzen

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Spart:** 20-30 Sekunden pro Job

### Parallele Tests

```yaml
needs: [unit-tests, integration-tests]
```

**Unit + Integration laufen parallel**  
**Spart:** ~30-60 Sekunden

### Artifact-Größe

```bash
npm prune --production
```

**Spart:** ~350 MB Upload/Download

---

## Monitoring & Debugging

### GitHub Actions Logs

**Zugriff:** Repository → Actions → Workflow Run

**Tipps:**
- Jeder Job hat separate Logs
- Klicke auf Job-Name für Details
- Expandiere Steps für vollständige Logs
- Download Logs möglich (Rechts-oben)

### Azure Logs (nach Deploy)

**Live Logs:**
```bash
az webapp log tail --name your-app --resource-group your-rg
```

**Oder:** Azure Portal → Log Stream

### Application Insights

**Setup:** Azure Portal → Application Insights → Create

**Features:**
- Live Metrics (Echtzeit)
- Failures & Exceptions
- Performance Charts
- Request Timeline
- Dependency Tracking (MongoDB)

---

## Best Practices

### ✅ Do's

1. **Tests vor Build:** Keine broken builds deployen
2. **Artifacts nutzen:** Nicht mehrmals builden
3. **Secrets rotieren:** Regelmäßig erneuern
4. **Smoke Tests:** Immer nach Deploy validieren
5. **Logs checken:** Bei Fehlern Logs analysieren

### ❌ Don'ts

1. **Secrets in Code:** Niemals in Repo committen
2. **Tests skippen:** Immer alle Tests laufen lassen
3. **Direkt zu Main:** Immer erst über develop
4. **Production DB in Tests:** Immer Test-DB nutzen
5. **Große Artifacts:** npm prune ausführen

---

## Erweiterte Konfiguration

### Mehrere Environments

```yaml
environment:
  name: 'Development'  # oder 'Staging', 'Production'
  url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
```

**Setup:** Settings → Environments → New environment

**Features:**
- Required Reviewers (Manuelle Approval)
- Wait Timer (Verzögerung vor Deploy)
- Deployment Branches (Nur bestimmte Branches)

### Notifications

**Slack Integration:**
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**E-Mail:** GitHub Settings → Notifications

---

## Troubleshooting Checkliste

- [ ] Alle Secrets konfiguriert?
- [ ] Azure App Settings gesetzt?
- [ ] MongoDB Atlas IP Whitelist (0.0.0.0/0 für Azure)?
- [ ] Node Version korrekt? (20 LTS)
- [ ] Publish Profile aktuell?
- [ ] Tests laufen lokal?
- [ ] Build läuft lokal?

---

## Nützliche Commands

### Lokal testen

```bash
# Unit Tests
npm test tests/units/

# Integration Tests (MongoDB muss laufen)
npm test tests/integrations/

# Alle Tests
npm test

# Build
npm run build

# Load Test
k6 run tests/k6.test.js
```

### Azure CLI

```bash
# Login
az login

# Logs streamen
az webapp log tail --name your-app --resource-group your-rg

# App Settings anzeigen
az webapp config appsettings list --name your-app --resource-group your-rg

# App neu starten
az webapp restart --name your-app --resource-group your-rg
```

### GitHub CLI

```bash
# Workflow auslösen
gh workflow run azure-webapps-node.yml

# Status prüfen
gh run list

# Logs anzeigen
gh run view --log
```

---

## Weitere Ressourcen

- [GitHub Actions Dokumentation](https://docs.github.com/en/actions)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [k6 Dokumentation](https://k6.io/docs/)
- [Vitest Dokumentation](https://vitest.dev/)
- [Supertest Guide](../SUPERTEST_GUIDE.md)
- [k6 Erklärung](../K6_EXPLANATION.md)
