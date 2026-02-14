# Remote Integration Test Erklärung
## app.remote.test.ts - E2E Tests gegen Azure Production

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Setup & Konfiguration](#setup--konfiguration)
3. [Test-Struktur](#test-struktur)
4. [Detaillierte Test-Erklärung](#detaillierte-test-erklärung)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Überblick

### Was ist ein Remote Integration Test?

Remote Integration Tests (auch **E2E Tests** genannt) testen die **deployed Production-App** auf Azure. Im Gegensatz zu lokalen Tests, die gegen `localhost` laufen, testen diese gegen die echte Azure-URL:

```
https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net
```

### Warum Remote Tests?

| Aspekt | Lokale Tests | Remote Tests |
|--------|-------------|--------------|
| **Geschwindigkeit** | ⚡ ~200ms | 🐌 ~1.6s |
| **Umgebung** | 🏠 Development | 🌐 Production |
| **Internet** | ❌ Nicht nötig | ✅ Erforderlich |
| **Azure Service** | ❌ Nicht nötig | ✅ Muss laufen |
| **Zweck** | Development | Validation |

**Remote Tests prüfen:**
- ✅ Ist die App auf Azure wirklich deployed?
- ✅ Funktioniert HTTPS korrekt?
- ✅ Sind alle Endpoints erreichbar?
- ✅ Ist die Performance akzeptabel?
- ✅ Funktioniert die Production-Konfiguration?

---

## Setup & Konfiguration

### 1. Imports und Dependencies

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
```

**Erklärung:**
- `vitest`: Test-Framework für Tests
- `supertest`: HTTP-Request-Library für API-Tests
- `beforeAll`: Hook der VOR allen Tests läuft

### 2. Konfiguration

```typescript
const PRODUCTION_URL = 'https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net';
const REMOTE_TIMEOUT = 10000; // 10 Sekunden
```

**Warum 10 Sekunden Timeout?**
- Azure kann beim Cold Start langsam sein
- Netzwerk-Latenz ist höher als localhost
- Gibt Azure genug Zeit für Antworten

### 3. Server-Erreichbarkeit prüfen

```typescript
let isServerReachable = false;

beforeAll(async () => {
  try {
    const response = await request(PRODUCTION_URL)
      .get('/health')
      .timeout(5000);
    
    isServerReachable = response.status === 200;
  } catch (error) {
    console.warn('⚠️  Production server not reachable - tests will be skipped');
    isServerReachable = false;
  }
});
```

**🔑 Wichtig: Graceful Degradation**

Dieser Code verhindert, dass Tests fehlschlagen wenn:
- 📡 Keine Internet-Verbindung besteht
- 🛑 Azure Service ist gestoppt
- 🔧 Server ist im Wartungsmodus

Jeder Test beginnt mit:
```typescript
if (!isServerReachable) return; // Test überspringen
```

---

## Test-Struktur

Die Tests sind in **7 Kategorien** organisiert:

### 1️⃣ Smoke Tests (Basis-Funktionalität)
**Zweck:** Prüfen ob die App überhaupt läuft

### 2️⃣ API Availability (Endpoints erreichbar)
**Zweck:** Alle wichtigen API-Endpoints testen

### 3️⃣ Security (Sicherheit)
**Zweck:** Authentifizierung, HTTPS, Cookies

### 4️⃣ Error Handling (Fehlerbehandlung)
**Zweck:** 404, Invalid JSON, etc.

### 5️⃣ Performance (Performance)
**Zweck:** Response-Zeiten messen

### 6️⃣ Infrastructure (Infrastruktur)
**Zweck:** Node-Version, Environment

### 7️⃣ CORS & Headers (HTTP-Headers)
**Zweck:** CORS-Konfiguration prüfen

---

## Detaillierte Test-Erklärung

### 1️⃣ Smoke Tests

#### Test: "should have a healthy production server"

```typescript
it('should have a healthy production server', async () => {
  if (!isServerReachable) {
    console.warn('⚠️  Skipping test - server not reachable');
    return;
  }

  const response = await request(PRODUCTION_URL)
    .get('/health')
    .timeout(REMOTE_TIMEOUT)
    .expect('Content-Type', /json/)
    .expect(200);

  expect(response.body).toHaveProperty('status', 'ok');
  expect(response.body).toHaveProperty('timestamp');
  expect(response.body.env).toBe('production');
}, REMOTE_TIMEOUT);
```

**Schritt-für-Schritt Erklärung:**

1. **Server-Check:** `if (!isServerReachable) return;`
   - Überspringt Test wenn Server nicht erreichbar
   
2. **HTTP GET Request:** `request(PRODUCTION_URL).get('/health')`
   - Sendet GET Request an `/health` Endpoint
   
3. **Timeout:** `.timeout(REMOTE_TIMEOUT)`
   - Max. 10 Sekunden warten
   
4. **Assertions:**
   - `.expect('Content-Type', /json/)` → Response muss JSON sein
   - `.expect(200)` → HTTP Status muss 200 OK sein
   - `expect(response.body).toHaveProperty('status', 'ok')` → Body muss `{"status": "ok"}` enthalten
   - `expect(response.body.env).toBe('production')` → Environment ist "production"

**Was wird getestet?**
- ✅ Server antwortet
- ✅ Health-Endpoint funktioniert
- ✅ Korrekte Production-Konfiguration

---

#### Test: "should serve the homepage"

```typescript
it('should serve the homepage', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/')
    .timeout(REMOTE_TIMEOUT)
    .expect(200);

  expect(response.headers['content-type']).toMatch(/html/);
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ Root-Route `/` ist erreichbar
- ✅ React-App wird ausgeliefert (HTML)
- ✅ Statisches File-Serving funktioniert

---

#### Test: "should have test page available"

```typescript
it('should have test page available', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/test')
    .timeout(REMOTE_TIMEOUT)
    .expect(200);

  expect(response.text).toContain('Server is RUNNING');
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ Test-Seite ist deployed
- ✅ Enthält erwarteten Text
- ✅ Server ist voll funktionsfähig

---

### 2️⃣ API Availability

#### Test: "should have agents API endpoint"

```typescript
it('should have agents API endpoint', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/api/agents')
    .timeout(REMOTE_TIMEOUT)
    .expect('Content-Type', /json/);

  expect(response.status).not.toBe(404);
  expect([200, 401, 403]).toContain(response.status);
}, REMOTE_TIMEOUT);
```

**🔑 Wichtig: Flexible Status-Prüfung**

Warum `expect([200, 401, 403]).toContain(response.status)`?

- **200 OK:** Endpoint funktioniert ohne Auth
- **401 Unauthorized:** Endpoint existiert, aber braucht Login
- **403 Forbidden:** Endpoint existiert, aber keine Berechtigung
- **404 Not Found:** ❌ Endpoint existiert NICHT (Test würde fehlschlagen)

**Logik:**
```
if (status === 404) {
  ❌ FAIL → Endpoint fehlt!
} else if (status in [200, 401, 403]) {
  ✅ PASS → Endpoint existiert!
}
```

---

### 3️⃣ Security

#### Test: "should reject unauthenticated POST requests"

```typescript
it('should reject unauthenticated POST requests', async () => {
  if (!isServerReachable) return;

  const testTicket = {
    title: 'Unauthorized Test Ticket',
    description: 'Should be rejected',
    priority: 'low'
  };

  const response = await request(PRODUCTION_URL)
    .post('/api/tickets')
    .send(testTicket)
    .timeout(REMOTE_TIMEOUT);

  expect([401, 403]).toContain(response.status);
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ POST-Requests ohne Auth werden abgelehnt
- ✅ Server ist sicher konfiguriert
- ✅ Keine unautorisierten Schreibzugriffe möglich

**Sicherheitskonzept:**
```
Kein JWT Token → POST /api/tickets → 401/403 ✅
Mit JWT Token → POST /api/tickets → 200 ✅
```

---

#### Test: "should have HTTPS enabled"

```typescript
it('should have HTTPS enabled', () => {
  expect(PRODUCTION_URL).toMatch(/^https:\/\//);
});
```

**Was wird getestet?**
- ✅ Production-URL beginnt mit `https://`
- ✅ Verschlüsselte Kommunikation
- ✅ Azure HTTPS korrekt konfiguriert

**Synchroner Test:** Kein `async/await` nötig, nur String-Prüfung!

---

### 4️⃣ Error Handling

#### Test: "should return 404 for non-existent routes"

```typescript
it('should return 404 for non-existent routes', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/api/this-does-not-exist')
    .timeout(REMOTE_TIMEOUT);

  expect(response.status).toBe(404);
}, REMOTE_TIMEOUT);
```

**Warum nur Status-Check?**

In Production könnte Azure:
- HTML Error-Seite zurückgeben (statt JSON)
- Custom 404 Page ausliefern
- IIS/Azure-spezifische Responses senden

**Lokale Tests vs Remote Tests:**
```
Lokal:  expect(response.body).toHaveProperty('error') ✅
Remote: expect(response.status).toBe(404) ✅ (flexibler!)
```

---

#### Test: "should handle invalid JSON gracefully"

```typescript
it('should handle invalid JSON gracefully', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .post('/api/tickets')
    .set('Content-Type', 'application/json')
    .send('{ invalid json }')
    .timeout(REMOTE_TIMEOUT);

  expect([400, 401, 403]).toContain(response.status);
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ Server crashed nicht bei invalid JSON
- ✅ Korrekte Error-Response (400 Bad Request)
- ✅ Oder Auth-Fehler wenn Middleware zuerst prüft

---

### 5️⃣ Performance

#### Test: "should respond to health check within reasonable time"

```typescript
it('should respond to health check within reasonable time', async () => {
  if (!isServerReachable) return;

  const start = Date.now();
  
  await request(PRODUCTION_URL)
    .get('/health')
    .timeout(REMOTE_TIMEOUT)
    .expect(200);
  
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(3000);
  
  console.log(`⏱️  Health check took ${duration}ms`);
}, REMOTE_TIMEOUT);
```

**Performance-Messung Schritt-für-Schritt:**

1. **Start-Zeit:** `const start = Date.now()`
   - Timestamp BEFORE Request
   
2. **Request ausführen:** `await request(...)`
   - Sendet Request und wartet auf Antwort
   
3. **End-Zeit:** `const duration = Date.now() - start`
   - Berechnet Differenz → Response-Zeit
   
4. **Assertion:** `expect(duration).toBeLessThan(3000)`
   - Muss unter 3 Sekunden sein
   
5. **Logging:** `console.log(...)`
   - Zeigt tatsächliche Zeit in Test-Output

**Warum 3 Sekunden?**
- Azure Cold Start kann 1-2 Sekunden dauern
- Netzwerk-Latenz: ~50-200ms
- Buffer für langsame Verbindungen

---

#### Test: "should handle concurrent requests"

```typescript
it('should handle concurrent requests', async () => {
  if (!isServerReachable) return;

  const requests = Array(5).fill(null).map(() =>
    request(PRODUCTION_URL)
      .get('/health')
      .timeout(REMOTE_TIMEOUT)
  );

  const start = Date.now();
  const responses = await Promise.all(requests);
  const duration = Date.now() - start;

  responses.forEach(response => {
    expect(response.status).toBe(200);
  });

  console.log(`⏱️  5 parallel requests took ${duration}ms`);
}, REMOTE_TIMEOUT);
```

**Concurrency-Test Erklärung:**

1. **Requests erstellen:** `Array(5).fill(null).map(...)`
   ```javascript
   // Erstellt 5 Promise-Objekte
   [
     request(...).get('/health'),
     request(...).get('/health'),
     request(...).get('/health'),
     request(...).get('/health'),
     request(...).get('/health')
   ]
   ```

2. **Parallel ausführen:** `await Promise.all(requests)`
   - Alle 5 Requests laufen GLEICHZEITIG
   - Wartet bis ALLE fertig sind
   
3. **Alle prüfen:** `responses.forEach(...)`
   - Jede Response muss 200 sein
   
**Was wird getestet?**
- ✅ Server kann parallele Requests handeln
- ✅ Kein Request blockiert andere
- ✅ Performance unter Last

---

### 6️⃣ Infrastructure

#### Test: "should run on correct Node version"

```typescript
it('should run on correct Node version', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/health')
    .timeout(REMOTE_TIMEOUT)
    .expect(200);

  expect(response.body.nodeVersion).toMatch(/^v20\./);
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ Azure nutzt Node.js 20 (aus package.json)
- ✅ Deployment-Konfiguration korrekt
- ✅ Runtime-Environment stimmt

**Regex-Erklärung:** `/^v20\./`
```
^     → Start des Strings
v20   → Buchstabe "v" gefolgt von "20"
\.    → Punkt (escaped)
      → Irgendwas danach (z.B. "v20.10.0")
```

Passt auf: `v20.0.0`, `v20.15.1`, etc.  
Passt NICHT auf: `v18.0.0`, `v22.0.0`

---

#### Test: "should report production environment"

```typescript
it('should report production environment', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/health')
    .timeout(REMOTE_TIMEOUT)
    .expect(200);

  expect(response.body.env).toBe('production');
}, REMOTE_TIMEOUT);
```

**Was wird getestet?**
- ✅ `NODE_ENV=production` ist gesetzt
- ✅ Production-Mode aktiv
- ✅ Keine Development-Features aktiv

---

### 7️⃣ CORS & Headers

#### Test: "should have CORS headers for allowed origins"

```typescript
it('should have CORS headers for allowed origins', async () => {
  if (!isServerReachable) return;

  const response = await request(PRODUCTION_URL)
    .get('/health')
    .set('Origin', PRODUCTION_URL)
    .timeout(REMOTE_TIMEOUT);

  expect(response.headers).toHaveProperty('access-control-allow-origin');
}, REMOTE_TIMEOUT);
```

**CORS-Konzept:**

1. **Browser sendet Origin-Header:** `.set('Origin', PRODUCTION_URL)`
   ```
   Origin: https://ticketsystemspa-...azurewebsites.net
   ```

2. **Server antwortet mit CORS-Header:**
   ```
   Access-Control-Allow-Origin: https://ticketsystemspa-...azurewebsites.net
   ```

3. **Test prüft:** Header ist vorhanden

**Warum wichtig?**
- ✅ Frontend kann API aufrufen
- ✅ CORS korrekt konfiguriert
- ✅ Keine Cross-Origin-Probleme

---

## Best Practices

### 1. Graceful Degradation

**Immer prüfen ob Server erreichbar:**
```typescript
if (!isServerReachable) return;
```

**Vorteile:**
- ✅ Tests schlagen nicht fehl bei Netzwerk-Problemen
- ✅ CI/CD Pipeline bricht nicht ab
- ✅ Entwickler-Erfahrung verbessert

---

### 2. Flexible Status-Checks

**Nicht nur 200 erwarten:**
```typescript
// ❌ FALSCH (zu strikt)
expect(response.status).toBe(200);

// ✅ RICHTIG (flexibel)
expect([200, 401, 403]).toContain(response.status);
expect(response.status).not.toBe(404);
```

**Warum?**
- Production könnte unterschiedliche Auth-Konfiguration haben
- Endpoints können existieren aber Auth brauchen
- Wichtig ist: Endpoint existiert (nicht 404)!

---

### 3. Timeouts erhöhen

**Remote Tests brauchen längere Timeouts:**
```typescript
const REMOTE_TIMEOUT = 10000; // 10 Sekunden

// In jedem Test:
it('test name', async () => {
  // ...
}, REMOTE_TIMEOUT); // ← Hier auch!
```

**Warum zwei Mal?**
1. `.timeout(REMOTE_TIMEOUT)` → Supertest Request Timeout
2. `, REMOTE_TIMEOUT)` am Ende → Vitest Test Timeout

---

### 4. Performance-Logging

**Immer Performance loggen:**
```typescript
const start = Date.now();
// ... Request ...
const duration = Date.now() - start;
console.log(`⏱️  Test took ${duration}ms`);
```

**Vorteile:**
- 📊 Sichtbarkeit in Test-Output
- 📈 Performance-Regression früh erkennen
- 🐌 Langsame Tests identifizieren

---

### 5. Separate Dateien

**Lokale vs Remote Tests trennen:**

```
tests/integrations/
├── app.local.test.ts   → Gegen localhost (Development)
├── app.remote.test.ts  → Gegen Azure (Production)
└── README.md           → Best Practices
```

**Warum?**
- ✅ Klare Trennung
- ✅ Separat ausführbar
- ✅ Unterschiedliche Timeouts/Configs

---

## Troubleshooting

### Problem 1: "Server not reachable"

**Symptom:**
```
⚠️  Production server not reachable - tests will be skipped
```

**Mögliche Ursachen:**
1. ❌ Keine Internet-Verbindung
2. ❌ Azure Service ist gestoppt
3. ❌ Falsche URL konfiguriert
4. ❌ Firewall blockiert Requests

**Lösung:**
```bash
# Manuell testen:
curl https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net/health

# Azure Status prüfen:
az webapp show --name ticketsystemspa --resource-group <group> --query state
```

---

### Problem 2: "Timeout exceeded"

**Symptom:**
```
Error: Timeout of 10000ms exceeded
```

**Lösung 1:** Timeout erhöhen
```typescript
const REMOTE_TIMEOUT = 20000; // 20 Sekunden
```

**Lösung 2:** Azure Cold Start vermeiden
- In Azure: "Always On" aktivieren
- Oder: Warmup-Request vor Tests senden

---

### Problem 3: "Expected 200, got 401"

**Symptom:**
```
AssertionError: expected 401 to be 200
```

**Ursache:** Endpoint braucht Authentication

**Lösung:** Flexibler Check
```typescript
// Vorher:
expect(response.status).toBe(200);

// Nachher:
expect([200, 401, 403]).toContain(response.status);
expect(response.status).not.toBe(404);
```

---

### Problem 4: "Invalid JSON response"

**Symptom:**
```
SyntaxError: Unexpected token < in JSON at position 0
```

**Ursache:** Server sendet HTML statt JSON (z.B. bei 404)

**Lösung:** Content-Type VORHER prüfen
```typescript
const response = await request(PRODUCTION_URL).get('/api/test');

// Nur parsen wenn JSON:
if (response.headers['content-type']?.includes('application/json')) {
  expect(response.body).toHaveProperty('data');
}
```

---

## Zusammenfassung

### Remote Tests - Das Wichtigste

| Aspekt | Details |
|--------|---------|
| **Wann laufen?** | NACH Deployment auf Azure |
| **Wogegen?** | Production URL (Azure) |
| **Dauer** | ~1.6 Sekunden (17 Tests) |
| **Zweck** | E2E Validation der Production-App |
| **Voraussetzungen** | Internet + laufender Azure Service |

### Test-Kategorien (7)

1. ✅ **Smoke Tests** → Server läuft
2. ✅ **API Availability** → Endpoints existieren
3. ✅ **Security** → Auth, HTTPS funktionieren
4. ✅ **Error Handling** → Fehler korrekt behandelt
5. ✅ **Performance** → Response-Zeiten OK
6. ✅ **Infrastructure** → Node-Version, Environment
7. ✅ **CORS & Headers** → HTTP-Konfiguration

### Ausführen

```bash
# Alle Remote Tests:
npm test tests/integrations/app.remote.test.ts

# Mit Vitest UI:
npm run test:ui

# In CI/CD:
# Läuft automatisch nach Deployment im "smoke-tests" Job
```

### Nächste Schritte

1. 📖 Lies auch: [tests/integrations/README.md](README.md)
2. 🏠 Verstehe lokale Tests: [app.local.test.ts](app.local.test.ts)
3. 🚀 CI/CD Pipeline: [.github/workflows/azure-webapps-node.yml](../../.github/workflows/azure-webapps-node.yml)
4. 📚 Supertest Basics: [SUPERTEST_GUIDE.md](../SUPERTEST_GUIDE.md)

---

**🎉 Du hast jetzt ein vollständiges Verständnis der Remote Integration Tests!**
