# Integration Tests - Best Practice

## 📁 Übersicht

Dieses Projekt verwendet **zwei separate Test-Strategien** für Integration-Tests:

| Datei | Zweck | Umgebung | Geschwindigkeit |
|-------|-------|----------|-----------------|
| **app.local.test.ts** | Entwicklung & CI/CD | Lokal (exportierte App) | ⚡ Sehr schnell |
| **app.remote.test.ts** | Production Validation | Azure (deployed) | 🐌 Langsamer |

---

## 🚀 Schnellstart

```bash
# Lokale Tests (für Development)
npm test tests/integrations/app.local.test.ts

# Remote Tests (für Production Check)
npm test tests/integrations/app.remote.test.ts

# Alle Integration-Tests
npm test tests/integrations/
```

---

## 📊 Vergleich: Lokal vs. Remote

### Local Tests (app.local.test.ts)

**✅ Vorteile:**
- ⚡ **Sehr schnell** (~5-50ms pro Test)
- 🔒 **Offline möglich** (keine Internet-Verbindung nötig)
- 🎯 **Keine externen Abhängigkeiten** (kein Server-Start, keine DB)
- 🧪 **Ideal für TDD** (Test-Driven Development)
- 💰 **Keine Kosten** (kein Azure-Service nötig)

**Verwendet:**
```typescript
import { app } from '../../src/server/app.js';
await request(app).get('/health').expect(200);
```

**Wann nutzen:**
- ✅ Während der Entwicklung
- ✅ In CI/CD Pipeline (vor Deployment)
- ✅ Für schnelles Feedback
- ✅ Beim Refactoring

---

### Remote Tests (app.remote.test.ts)

**✅ Vorteile:**
- 🌐 **Testet echte Production** (Azure Environment)
- 🔒 **Prüft HTTPS, Security**
- 📊 **Misst echte Performance**
- ✅ **End-to-End Validierung**
- 🏗️ **Testet Infrastructure** (Node Version, Environment)

**Verwendet:**
```typescript
const PRODUCTION_URL = 'https://your-app.azurewebsites.net';
await request(PRODUCTION_URL).get('/health').expect(200);
```

**Wann nutzen:**
- ✅ Nach Deployment (Smoke Tests)
- ✅ Für Production-Monitoring
- ✅ Vor wichtigen Releases
- ✅ Als Gesundheitscheck

**⚠️ Limitierungen:**
- 🐌 Langsamer (~1-3 Sekunden pro Test)
- 📡 Braucht Internet-Verbindung
- 💰 Braucht laufenden Azure Service
- ⚠️ Kann fehlschlagen wenn Azure down ist

---

## 🏗️ Architektur

### Server-Struktur (refactored)

```
src/server/
├── app.js         # Express App (exportierbar für Tests)
└── index.js       # Server Entry Point (startet app.js)
```

**Warum getrennt?**

**Vorher:**
```javascript
// ❌ Alles in index.js - nicht testbar
const app = express();
// ... middleware, routes ...
app.listen(8080); // Server startet IMMER
```

**Nachher:**
```javascript
// ✅ app.js - exportierbar
export const app = express();
// ... middleware, routes ...
// KEIN app.listen()!

// ✅ index.js - importiert & startet
import { app } from './app.js';
if (process.env.NODE_ENV !== 'test') {
  app.listen(8080);
}
```

**Vorteile:**
- Tests können `app` importieren ohne Server zu starten
- Schneller (kein Port-Binding)
- Parallel ausführbar (keine Port-Konflikte)
- Einfacher zu mocken

---

## 📝 Test-Coverage

### Local Tests (16 Tests)

**Health & Status (3 Tests)**
- ✅ Health endpoint returns correct structure
- ✅ Test page serves HTML
- ✅ Debug files endpoint works

**API Endpoints (6 Tests)**
- ✅ Agents API accessible
- ✅ Tickets API accessible
- ✅ Query parameters supported
- ✅ POST rejected without auth
- ✅ Validates required fields
- ✅ Rejects invalid priority values

**Error Handling (3 Tests)**
- ✅ 404 for non-existent routes
- ✅ 404 for invalid methods
- ✅ Handles malformed JSON

**Headers & CORS (2 Tests)**
- ✅ CORS headers present
- ✅ Accepts JSON content-type

**Performance (2 Tests)**
- ✅ Quick response time (<100ms)
- ✅ Handles parallel requests

---

### Remote Tests (18 Tests)

**Smoke Tests (3 Tests)**
- ✅ Server healthy
- ✅ Homepage accessible
- ✅ Test page available

**API Availability (3 Tests)**
- ✅ Agents endpoint reachable
- ✅ Tickets endpoint reachable
- ✅ Auth endpoint reachable

**Security (3 Tests)**
- ✅ Rejects unauthorized POST
- ✅ HTTPS enabled
- ✅ Secure cookies in production

**Error Handling (2 Tests)**
- ✅ 404 for invalid routes
- ✅ Handles malformed JSON

**Performance (2 Tests)**
- ✅ Response time <3 seconds
- ✅ Handles concurrent requests

**Infrastructure (2 Tests)**
- ✅ Correct Node version (20.x)
- ✅ Production environment reported

**CORS & Headers (2 Tests)**
- ✅ CORS headers for allowed origins
- ✅ Correct content-type

---

## 🔧 Verwendung in CI/CD

### GitHub Actions Integration

Die Tests sind in [.github/workflows/azure-webapps-node.yml](../.github/workflows/azure-webapps-node.yml) integriert:

```yaml
# JOB 1: Integration Tests (lokal)
integration-tests:
  runs-on: ubuntu-latest
  services:
    mongodb:
      image: mongo:7
  steps:
    - run: npm test tests/integrations/app.local.test.ts

# JOB 2: Deploy (nur wenn Tests erfolgreich)
deploy:
  needs: integration-tests
  # ... Deploy zu Azure

# JOB 3: Smoke Tests (nach Deploy)
smoke-tests:
  needs: deploy
  steps:
    - run: npm test tests/integrations/app.remote.test.ts
```

**Pipeline-Flow:**
```
Integration Tests (lokal)
        ↓ (nur wenn ✅)
      Build
        ↓
     Deploy
        ↓
  Smoke Tests (remote)
```

---

## 🧪 Test-Beispiele

### Lokaler Test

```typescript
describe('GET /api/tickets', () => {
  it('should handle tickets endpoint', async () => {
    const response = await request(app)  // Verwendet lokale app
      .get('/api/tickets');

    expect(response.status).not.toBe(404);
  });
});
```

**Ausführung:**
```bash
npm test tests/integrations/app.local.test.ts
# ✅ Läuft in ~200ms
```

---

### Remote Test

```typescript
describe('Smoke Tests', () => {
  it('should have a healthy production server', async () => {
    const response = await request(PRODUCTION_URL)  // Azure URL
      .get('/health')
      .timeout(10000)  // Höherer Timeout
      .expect(200);

    expect(response.body.env).toBe('production');
  });
});
```

**Ausführung:**
```bash
npm test tests/integrations/app.remote.test.ts
# ⏱️ Läuft in ~5-10 Sekunden
```

---

## 🎯 Best Practices

### ✅ DO (Empfohlen)

1. **Lokale Tests für Development**
   ```bash
   # Während du code schreibst:
   npx vitest tests/integrations/app.local.test.ts --watch
   ```

2. **Remote Tests nach Deployment**
   ```bash
   # Nach jedem Production-Deploy:
   npm test tests/integrations/app.remote.test.ts
   ```

3. **Spezifische Assertions**
   ```typescript
   // ✅ Gut - klar was erwartet wird
   expect(response.status).toBe(200);
   expect(response.body).toHaveProperty('status', 'ok');
   
   // ❌ Schlecht - zu unspezifisch
   expect([200, 401, 500]).toContain(response.status);
   ```

4. **Timeouts für Remote-Tests**
   ```typescript
   // ✅ Remote Tests brauchen längere Timeouts
   await request(PRODUCTION_URL)
     .get('/api/tickets')
     .timeout(10000);  // 10 Sekunden
   ```

5. **Server-Erreichbarkeit prüfen**
   ```typescript
   // ✅ Remote Tests sollten graceful degradieren
   let isServerReachable = false;
   beforeAll(async () => {
     try {
       await request(PRODUCTION_URL).get('/health');
       isServerReachable = true;
     } catch {
       console.warn('Server not reachable - tests skipped');
     }
   });
   ```

---

### ❌ DON'T (Vermeide)

1. **Keine externen Abhängigkeiten in lokalen Tests**
   ```typescript
   // ❌ Nicht in lokalen Tests:
   await fetch('https://external-api.com');
   await database.connect();
   
   // ✅ Nur App-Logik testen:
   await request(app).get('/health');
   ```

2. **Keine Test-Daten in Production**
   ```typescript
   // ❌ Nicht in Remote-Tests:
   await request(PRODUCTION_URL)
     .post('/api/tickets')
     .send({ title: 'Test Ticket' });  // Bleibt in Production DB!
   
   // ✅ Nur lesen oder erwartete Fehler:
   const response = await request(PRODUCTION_URL)
     .post('/api/tickets')
     .send({ title: 'Test' });
   expect([401, 403]).toContain(response.status);  // Sollte reject sein
   ```

3. **Keine hartcodierten URLs**
   ```typescript
   // ❌ Hartcodiert
   const url = 'https://my-app.azurewebsites.net';
   
   // ✅ Environment Variable
   const url = process.env.PRODUCTION_URL || 
               'https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net';
   ```

---

## 🔍 Debugging

### Lokale Tests debuggen

```typescript
it('should debug test', async () => {
  const response = await request(app).get('/health');
  
  // Debug-Output
  console.log('Status:', response.status);
  console.log('Body:', response.body);
  console.log('Headers:', response.headers);
  
  expect(response.status).toBe(200);
});
```

### Remote Tests debuggen

```bash
# Mit erhöhtem Timeout
npm test tests/integrations/app.remote.test.ts -- --test-timeout=30000

# Einzelnen Test ausführen
npx vitest tests/integrations/app.remote.test.ts -t "should have a healthy"
```

---

## 📈 Performance-Vergleiche

### Local Tests
```
✓ Health endpoint: 5ms
✓ API endpoint: 7ms
✓ 10 parallel requests: 33ms
───────────────────────
Total: ~200ms für 16 Tests
```

### Remote Tests
```
✓ Health endpoint: 850ms
✓ API endpoint: 1200ms
✓ 5 parallel requests: 2800ms
───────────────────────
Total: ~10 Sekunden für 18 Tests
```

**Unterschied:** Lokal ist **50x schneller**! ⚡

---

## 🛠️ Weitere Ressourcen

- [Unit Test Guide](UNIT_TEST_GUIDE.md) - Unit-Tests verstehen
- [Supertest Guide](SUPERTEST_GUIDE.md) - Supertest Dokumentation
- [CI/CD Workflow](../.github/workflows/README.md) - GitHub Actions Pipeline
- [K6 Load Tests](K6_EXPLANATION.md) - Performance-Tests

---

## 📊 Zusammenfassung

**Lokale Tests (app.local.test.ts):**
- ✅ Für Development & CI/CD
- ✅ Schnell & offline
- ✅ 16 Tests in ~200ms

**Remote Tests (app.remote.test.ts):**
- ✅ Für Production Validation
- ✅ End-to-End in echter Umgebung
- ✅ 18 Tests in ~10 Sekunden

**Best Practice:**
- Entwicklung → Lokale Tests
- Deployment → Remote Tests
- Beide zusammen → Vollständige Absicherung! 🎯
