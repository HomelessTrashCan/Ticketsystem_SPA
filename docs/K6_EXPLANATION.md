# k6 Load Test Erklärung

## Übersicht

Das k6-Skript (`k6.test.js`) ist ein Performance- und Lasttest für die Azure-App-Service-Website.

## Skript-Aufbau

### Imports

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
```

**Was wird importiert:**
- `http`: Modul für HTTP-Requests
- `check`: Funktion zur Validierung von Responses
- `sleep`: Funktion für Wartezeiten (simuliert User-Verhalten)

---

### Konfiguration

```javascript
export let options = {
   ext: {  
    loadimpact: {  
      distribution: {  
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 100 },  
      },  
    },  
  },
```

**Load Impact Cloud Config** (Optional):
- Definiert geografische Verteilung der virtuellen User
- `amazon:ie:dublin`: 100% der User kommen aus Dublin, Irland
- **Hinweis:** Funktioniert nur mit k6 Cloud, wird bei lokalem Test ignoriert

---

### Test-Phasen (Stages)

```javascript
  stages: [
    { duration: '1m', target: 100 }, // Ramp-up auf 100 Nutzer
    { duration: '3m', target: 100 }, // Haltephase
    { duration: '1m', target: 0 },   // Ramp-down
  ],
```

**3 Test-Phasen:**

| Phase | Dauer | Target | Beschreibung |
|-------|-------|--------|--------------|
| Ramp-up | 1 Minute | 100 User | Steigert graduell von 0 auf 100 virtuelle User |
| Haltephase | 3 Minuten | 100 User | Hält konstant 100 User (Hauptbelastung) |
| Ramp-down | 1 Minute | 0 User | Reduziert graduell auf 0 User (Cool-down) |

**Gesamt-Testdauer:** 5 Minuten

**Timeline:**
```
0:00 ────────── 1:00 ────────────────── 4:00 ────────── 5:00
  0 User      100 User              100 User        0 User
     ↗↗↗           ═════════════          ↘↘↘
```

---

### Thresholds (Erfolgskriterien)

```javascript
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% unter 500ms
  },
```

**Erfolgskriterium:**
- **p(95) < 500ms**: 95% aller HTTP-Requests müssen schneller als 500ms sein
- Wenn dieses Kriterium nicht erfüllt wird → Test schlägt fehl (Exit Code 1)

**Was bedeutet p(95)?**
- Das 95. Perzentil
- 95% aller Requests sind schneller als dieser Wert
- Nur 5% der Requests sind langsamer

---

### Test-Funktion

```javascript
export default function () {
  const res = http.get('https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net/');
  check(res, { 'Status ist 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Diese Funktion wird von jedem virtuellen User wiederholt ausgeführt:**

1. **HTTP GET Request:**
   ```javascript
   const res = http.get('...');
   ```
   - Ruft die Azure-Website auf
   - Speichert Response in `res`

2. **Validierung:**
   ```javascript
   check(res, { 'Status ist 200': (r) => r.status === 200 });
   ```
   - Prüft ob HTTP Status Code 200 (OK) zurückkommt
   - Wird als "check" in der Statistik gezählt
   - Name des Checks: "Status ist 200"

3. **Pause (Think Time):**
   ```javascript
   sleep(1);
   ```
   - Wartet 1 Sekunde
   - Simuliert echtes User-Verhalten (User lesen, denken, klicken)
   - Ohne sleep würden User kontinuierlich Requests senden

---

## Was passiert während des Tests?

### Timeline des Testverlaufs

| Zeit | Active Users | Requests/Sek (ca.) | Phase |
|------|--------------|-------------------|-------|
| 0:00 | 0 | 0 | Start |
| 0:30 | 50 | 50 | Ramp-up |
| 1:00 | 100 | 100 | Ramp-up Ende |
| 2:00 | 100 | 100 | Haltephase |
| 3:00 | 100 | 100 | Haltephase |
| 4:00 | 100 | 100 | Haltephase Ende |
| 4:30 | 50 | 50 | Ramp-down |
| 5:00 | 0 | 0 | Test Ende |

**Berechnung:** 
- Bei 100 Usern mit je 1 Request/Sekunde (sleep(1)) → ca. 100 Requests/Sek
- Bei deinem Test: 19.855 Requests in 5 Minuten = **~66 Requests/Sek** im Durchschnitt
- (Passt zur Berechnung mit Ramp-up/down Phase)

---

## Test-Ergebnisse Interpretation

### Beispiel-Output Erklärung

```bash
✗ 'p(95)<500' p(95)=701.01ms
```
❌ **Test fehlgeschlagen** - 95. Perzentil ist 701ms statt geforderten 500ms

```bash
checks_succeeded...: 100.00% 19855 out of 19855
```
✅ **Alle Validierungen erfolgreich** - Jeder Request hatte Status 200

```bash
http_req_duration..............: avg=212.38ms min=9.39ms med=128.4ms max=2.72s p(90)=542.24ms p(95)=701.01ms
```

**Metriken:**
- **avg=212.38ms**: Durchschnittliche Response Time
- **min=9.39ms**: Schnellster Request
- **med=128.4ms**: Median (50% schneller, 50% langsamer)
- **max=2.72s**: Langsamster Request 
- **p(90)=542.24ms**: 90% der Requests unter 542ms
- **p(95)=701.01ms**: 95% der Requests unter 701ms ❌

```bash
http_req_failed................: 0.00%  0 out of 19855
```
✅ **Keine fehlgeschlagenen Requests** - Alle erfolgreich

```bash
http_reqs......................: 19855  65.963183/s
```
📊 **Gesamt:** 19.855 Requests mit durchschnittlich 66 Requests/Sekunde

```bash
vus............................: 1      min=1          max=100
vus_max........................: 100    min=100        max=100
```
👥 **Virtuelle User:** Maximum 100 gleichzeitige User erreicht

---

## Analyse der Ergebnisse

### ✅ Das Positive

- **100% Erfolgsrate** - Alle Requests erfolgreich (Status 200)
- **Keine Fehler** - 0% failed requests
- **Guter Durchschnitt** - 212ms durchschnittliche Response Time
- **Guter Median** - 128ms (die meisten Requests sind schnell)

### ❌ Das Problem

- **95. Perzentil zu hoch** - 701ms statt geforderte 500ms
- **5% langsame Requests** - Ca. 993 von 19.855 waren > 701ms
- **Maximalwert hoch** - Einige Requests dauerten bis zu 2,72 Sekunden
- **Performance unter Last** - Bei 100 gleichzeitigen Usern Performance-Einbußen

### 🔍 Mögliche Ursachen

1. **Azure App Service Plan**
   - Eventuell zu kleines Tier/SKU (Basic/Free/Standard)
   - Nicht genug CPU/RAM Ressourcen

2. **Keine Auto-Skalierung**
   - App läuft auf einer einzigen Instanz
   - Kein Scale-out bei hoher Last

3. **Datenbankperformance**
   - MongoDB Atlas Queries könnten optimiert werden
   - Fehlende Indizes
   - Verbindungslimit erreicht

4. **Fehlende Caching-Strategie**
   - Statische Ressourcen nicht gecacht
   - Keine CDN-Nutzung

5. **Cold Start Probleme**
   - Erste Requests nach Inaktivität langsam
   - App Service "schläft" bei Inaktivität (Free/Basic Tier)

6. **Network Latency**
   - Test läuft lokal, Server in Switzerland North
   - Geografische Distanz

---

## Empfohlene Maßnahmen

### 1. Threshold anpassen (Quick Win)

```javascript
thresholds: {
    http_req_duration: ['p(95)<800'], // Realistischer Wert
},
```

### 2. Azure Auto-Scaling aktivieren

```powershell
# Scale-out Regel hinzufügen
az monitor autoscale create \
  --resource-group <your-rg> \
  --resource <app-service-name> \
  --resource-type Microsoft.Web/serverfarms \
  --min-count 1 --max-count 3 --count 1
```

### 3. Application Insights nutzen

- Langsame Requests identifizieren
- Live Metrics während Test ansehen
- Dependency Tracking (MongoDB Queries)

### 4. Performance-Optimierungen

- **Caching:** Redis Cache für häufige Queries
- **CDN:** Azure CDN für statische Assets
- **Database:** MongoDB Indizes überprüfen
- **Code:** Async/Await richtig nutzen
- **Bundle Size:** Frontend-Bundle optimieren

### 5. Erweiterte Tests

```javascript
// Verschiedene Endpoints testen
export default function () {
  http.get('https://your-app/');
  http.get('https://your-app/api/tickets');
  http.post('https://your-app/api/auth/login', payload);
  sleep(1);
}
```

---

## Test ausführen

### Mit npm Script
```powershell
npm run test:k6
```

### Direkt mit k6
```powershell
k6 run tests/k6.test.js
```

### Mit verschiedenen Optionen
```powershell
# Mehr VUs und längere Duration
k6 run --vus 200 --duration 10m tests/k6.test.js

# Mit Output zu CSV
k6 run --out csv=test_results.csv tests/k6.test.js

# Mit Summary-Export
k6 run --summary-export=summary.json tests/k6.test.js
```

---

## Weitere Ressourcen

- [k6 Dokumentation](https://k6.io/docs/)
- [k6 HTTP Requests](https://k6.io/docs/using-k6/http-requests/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [Azure App Service Performance](https://learn.microsoft.com/en-us/azure/app-service/overview-performance)
