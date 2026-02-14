# Tests

Diese Tests verwenden [Vitest](https://vitest.dev/) für Unit- und Integrationstests und [k6](https://k6.io/) für Lasttests.

## Voraussetzungen

Bevor Sie die Tests ausführen:

1. **MongoDB Server muss laufen** - Die Tests verwenden die MongoDB Atlas-Verbindung
2. **Umgebungsvariablen setzen** - Erstellen Sie eine `.env` Datei (siehe `.env.example`) mit Ihrer MongoDB URI
3. **Backend Server muss laufen** - Starten Sie den Server:
   ```powershell
   node src\server\index.js
   ```
4. **Datenbank muss initialisiert sein** - Führen Sie das Seed-Script aus:
   ```powershell
   node src\server\seed.mjs
   ```

## Tests ausführen

### Alle Unit- und Integration-Tests ausführen
```powershell
npm test
```

### Tests im Watch-Modus
```powershell
npx vitest
```

### Nur spezifische Tests
```powershell
npx vitest tests/units/agents.test.ts
npx vitest tests/integrations/tickets.test.ts
```

### k6 Lasttests
**Wichtig:** k6 Tests erfordern die [k6 CLI Installation](https://k6.io/docs/getting-started/installation/).

Nach der Installation:
```powershell
npm run test:k6
# oder direkt:
k6 run tests/k6.test.js
```

## Test-Struktur

### Unit Tests (`tests/units/`)
- `agents.test.ts` - Tests für die Agents-API

### Integration Tests (`tests/integrations/`)
- `tickets.test.ts` - End-to-End Tests für die Tickets-API
  - GET /api/tickets
  - POST /api/tickets
  - PUT /api/tickets/:id
  - DELETE /api/tickets/:id

### Lasttests
- `k6.test.js` - k6 Lasttest (100 Nutzer über 5 Minuten)

## Was wird getestet?

### Agents API
- ✅ Rückgabe eines Arrays von E-Mails
- ✅ Mindestens eine E-Mail vorhanden
- ✅ Gültige E-Mail-Formate
- ✅ Keine Duplikate

### Tickets API
- ✅ Alle Tickets abrufen
- ✅ Neues Ticket erstellen mit sequenzieller ID
- ✅ Ticket aktualisieren
- ✅ Ticket löschen
- ✅ Fehlerbehandlung (404, 400)
- ✅ Sequenzielle ID-Generierung (T-1001, T-1002, ...)

## Hinweise

- Die Tests erstellen und löschen Test-Tickets in der echten Datenbank
- Test-Tickets haben den Titel "Test Ticket", "Ticket to Update", etc.
- Nach jedem Test-Lauf werden Test-Tickets automatisch gelöscht
- Die Tests setzen voraus, dass der Server auf `http://localhost:8080` läuft
