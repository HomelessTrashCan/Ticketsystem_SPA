# Unit-Tests verstehen - Schritt für Schritt

## 📚 Was sind Unit-Tests?

**Unit-Tests = Tests für einzelne "Bausteine" (Funktionen)**

Stell dir vor:
- Du baust ein Haus 🏠
- Jeder Raum = Eine Funktion
- Unit-Test = Du prüfst, ob jeder Raum richtig funktioniert, BEVOR du das ganze Haus baust

**In einem Satz:**  
*"Ich prüfe, ob meine Funktion bei verschiedenen Eingaben die richtigen Ergebnisse liefert."*

---

## 🎯 Praktisches Beispiel aus diesem Projekt

### Schritt 1: Die zu testende Funktion

Wir haben eine einfache Funktion erstellt: `istTitelGueltig()`

**Datei:** [src/utils/ticketHelpers.ts](../src/utils/ticketHelpers.ts)

```typescript
export function istTitelGueltig(titel: string): boolean {
  // Prüfe ob Titel existiert und ein String ist
  if (!titel || typeof titel !== 'string') {
    return false;
  }

  // Entferne Leerzeichen am Anfang und Ende
  const bereinigterTitel = titel.trim();

  // Prüfe Länge
  if (bereinigterTitel.length < 3) {
    return false; // Zu kurz
  }

  if (bereinigterTitel.length > 100) {
    return false; // Zu lang
  }

  return true; // Alles gut!
}
```

**Was macht sie?**  
Prüft, ob ein Ticket-Titel gültig ist:
- ✅ Mindestens 3 Zeichen
- ✅ Maximal 100 Zeichen
- ✅ Nicht leer

**Beispiele:**
```typescript
istTitelGueltig("Bug im Login")  → ✅ true  (gültig)
istTitelGueltig("Hi")            → ❌ false (zu kurz)
istTitelGueltig("")              → ❌ false (leer)
istTitelGueltig("A".repeat(101)) → ❌ false (zu lang)
```

---

## 🧪 Schritt 2: Den Unit-Test schreiben

**Datei:** [tests/units/agents.test.ts](agents.test.ts)

### Die Grundstruktur

```typescript
// 1. Importiere die Test-Tools
import { describe, it, expect } from 'vitest';

// 2. Importiere die zu testende Funktion
import { istTitelGueltig } from '../../src/utils/ticketHelpers';

// 3. Gruppiere Tests mit "describe"
describe('istTitelGueltig', () => {
  
  // 4. Schreibe einzelne Test-Fälle mit "it"
  it('sollte true zurückgeben für gültige Titel', () => {
    // Test-Code hier
  });
});
```

---

## 🔍 Das AAA-Prinzip: Wie ein Test aufgebaut ist

Jeder gute Test folgt dem **AAA-Prinzip:**

### 1. ARRANGE (Vorbereitung)
Bereite die Test-Daten vor

```typescript
const gueltiger_titel = 'Bug im Login';
```

### 2. ACT (Ausführung)
Führe die zu testende Funktion aus

```typescript
const ergebnis = istTitelGueltig(gueltiger_titel);
```

### 3. ASSERT (Überprüfung)
Überprüfe, ob das Ergebnis stimmt

```typescript
expect(ergebnis).toBe(true);
```

### Komplett zusammen:

```typescript
it('sollte true zurückgeben für gültige Titel', () => {
  // ARRANGE: Vorbereitung
  const gueltiger_titel = 'Bug im Login';

  // ACT: Ausführung
  const ergebnis = istTitelGueltig(gueltiger_titel);

  // ASSERT: Überprüfung
  expect(ergebnis).toBe(true);
});
```

---

## 📊 Alle 5 Test-Fälle erklärt

### Test 1: Gültiger Titel ✅

```typescript
it('sollte true zurückgeben für gültige Titel', () => {
  const gueltiger_titel = 'Bug im Login';
  const ergebnis = istTitelGueltig(gueltiger_titel);
  expect(ergebnis).toBe(true);
});
```

**Was passiert?**
- Input: `"Bug im Login"` (12 Zeichen)
- Erwartung: `true` (weil 3-100 Zeichen)
- ✅ Test bestanden

---

### Test 2: Zu kurzer Titel ❌

```typescript
it('sollte false zurückgeben für zu kurze Titel', () => {
  const zu_kurz = 'Hi';
  const ergebnis = istTitelGueltig(zu_kurz);
  expect(ergebnis).toBe(false);
});
```

**Was passiert?**
- Input: `"Hi"` (2 Zeichen)
- Erwartung: `false` (weil weniger als 3 Zeichen)
- ✅ Test bestanden

---

### Test 3: Leerer Titel ❌

```typescript
it('sollte false zurückgeben für leere Titel', () => {
  const leer = '';
  const ergebnis = istTitelGueltig(leer);
  expect(ergebnis).toBe(false);
});
```

**Was passiert?**
- Input: `""` (0 Zeichen)
- Erwartung: `false` (leerer String nicht erlaubt)
- ✅ Test bestanden

---

### Test 4: Zu langer Titel ❌

```typescript
it('sollte false zurückgeben für zu lange Titel', () => {
  const zu_lang = 'A'.repeat(101); // "AAA..." 101 mal
  const ergebnis = istTitelGueltig(zu_lang);
  expect(ergebnis).toBe(false);
});
```

**Was passiert?**
- Input: `"AAAA..."` (101 Zeichen)
- Erwartung: `false` (weil mehr als 100 Zeichen)
- ✅ Test bestanden

---

### Test 5: Titel mit Leerzeichen ✅

```typescript
it('sollte Leerzeichen am Anfang/Ende ignorieren', () => {
  const mit_leerzeichen = '  Test  ';
  const ergebnis = istTitelGueltig(mit_leerzeichen);
  expect(ergebnis).toBe(true);
});
```

**Was passiert?**
- Input: `"  Test  "` (4 Zeichen + Leerzeichen)
- Nach `trim()`: `"Test"` (4 Zeichen)
- Erwartung: `true` (weil 4 Zeichen nach Bereinigung)
- ✅ Test bestanden

---

## 🎨 Visualisierung: Was passiert beim Test?

```
┌─────────────────────────────────────────────┐
│  Test: "sollte true für gültige Titel"     │
└─────────────────────────────────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │   ARRANGE       │
          │ titel = "Bug    │
          │  im Login"      │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │      ACT        │
          │ istTitelGueltig │
          │   ("Bug...")    │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │    ASSERT       │
          │ expect = true?  │
          │   ✅ JA!        │
          └────────┬────────┘
                   ▼
              ✅ PASSED!
```

---

## 🔧 `expect()` und Matcher verstehen

### Was ist `expect()`?

`expect()` sagt: "Ich ERWARTE, dass..."

### Häufige Matcher

| Matcher | Bedeutung | Beispiel |
|---------|-----------|----------|
| `.toBe(wert)` | Exakt gleich | `expect(5).toBe(5)` ✅ |
| `.toBe(wert)` | Nicht gleich | `expect(5).toBe(3)` ❌ |
| `.not.toBe(wert)` | NICHT gleich | `expect(5).not.toBe(3)` ✅ |
| `.toBeNull()` | Ist null | `expect(null).toBeNull()` ✅ |
| `.toBeDefined()` | Ist definiert | `expect(x).toBeDefined()` |
| `.toHaveLength(n)` | Länge ist n | `expect([1,2,3]).toHaveLength(3)` ✅ |
| `.toContain(x)` | Enthält x | `expect([1,2,3]).toContain(2)` ✅ |

### Beispiele aus unserem Test:

```typescript
expect(ergebnis).toBe(true);
// → "Ich erwarte, dass ergebnis genau true ist"

expect(ergebnis).toBe(false);
// → "Ich erwarte, dass ergebnis genau false ist"
```

**Weitere Beispiele:**
```typescript
expect(5 + 3).toBe(8);                    // ✅ Ist 5+3 = 8?
expect("Hallo").toBe("Welt");             // ❌ Ist "Hallo" = "Welt"?
expect([1, 2, 3]).toHaveLength(3);        // ✅ Hat Array 3 Elemente?
expect("Test").not.toBe("");              // ✅ Ist "Test" NICHT leer?
```

---

## 🚀 Test ausführen

### Im Terminal:

```powershell
# Nur diesen einen Test
npm test tests/units/agents.test.ts

# Alle Unit-Tests
npm test tests/units/

# Mit Watch-Mode (läuft automatisch bei Änderungen)
npx vitest tests/units/
```

### Erwartetes Ergebnis:

```bash
✓ tests/units/agents.test.ts (5 tests) 6ms
  ✓ istTitelGueltig (5)
    ✓ sollte true zurückgeben für gültige Titel 2ms
    ✓ sollte false zurückgeben für zu kurze Titel 0ms
    ✓ sollte false zurückgeben für leere Titel 0ms
    ✓ sollte false zurückgeben für zu lange Titel 0ms
    ✓ sollte Leerzeichen am Anfang/Ende ignorieren 0ms

Test Files  1 passed (1)
     Tests  5 passed (5)
```

✅ **Alle 5 Tests bestanden!**

---

## 🛡️ Warum sind Unit-Tests wichtig?

### Szenario OHNE Tests:

```typescript
// Du änderst die Funktion
function istTitelGueltig(titel: string): boolean {
  return titel.length > 2; // FEHLER: Vergessen auf null zu prüfen!
}

// Später in der App:
istTitelGueltig(null); // 💥 CRASH! TypeError: Cannot read length of null
```

❌ **Problem:** Der Fehler wird erst in Production entdeckt!

---

### Szenario MIT Tests:

```typescript
// Du änderst die Funktion
function istTitelGueltig(titel: string): boolean {
  return titel.length > 2; // FEHLER
}

// Du führst Tests aus:
npm test
```

```bash
❌ FAIL: sollte false zurückgeben für leere Titel
   TypeError: Cannot read property 'length' of null
   
   Expected: false
   Received: [Error]
```

✅ **Vorteil:** Du siehst den Fehler SOFORT, bevor er in Production geht!

---

## 📊 Unit-Tests vs Integration-Tests

| Aspekt | Unit-Test | Integration-Test |
|--------|-----------|------------------|
| **Was wird getestet?** | Einzelne Funktion | Mehrere Komponenten zusammen |
| **Beispiel** | `istTitelGueltig()` | API-Call + Datenbank + Response |
| **Geschwindigkeit** | ⚡ Sehr schnell (~1ms) | 🐌 Langsamer (~100-500ms) |
| **Externe Abhängigkeiten** | ❌ Keine (kein Server, DB) | ✅ Ja (Server, Datenbank) |
| **Komplexität** | 🟢 Einfach | 🟡 Komplexer |
| **Wann ausführen?** | Bei jeder Änderung | Vor Deployment |
| **Zweck** | Einzelne Logik prüfen | Gesamtsystem prüfen |

### Beispiel-Vergleich:

**Unit-Test:**
```typescript
// Testet NUR die Funktion
it('should validate email', () => {
  expect(istEmailGueltig('test@example.com')).toBe(true);
});
```

**Integration-Test:**
```typescript
// Testet API + DB + Validierung
it('should create ticket with valid data', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({ title: 'Bug', email: 'test@example.com' });
  
  expect(response.status).toBe(201);
});
```

---

## 🛠️ Die Funktion in der Praxis nutzen

Jetzt kannst du `istTitelGueltig()` in deiner App verwenden:

### In einem React-Formular:

```typescript
import { istTitelGueltig } from './utils/ticketHelpers';

function TicketForm() {
  const [titel, setTitel] = useState('');
  const [fehler, setFehler] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validierung mit unserer getesteten Funktion!
    if (!istTitelGueltig(titel)) {
      setFehler('Titel muss zwischen 3 und 100 Zeichen haben');
      return;
    }
    
    // Weiter mit Ticket erstellen...
    erstelleTicket(titel);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={titel} 
        onChange={(e) => setTitel(e.target.value)}
      />
      {fehler && <p className="error">{fehler}</p>}
      <button type="submit">Erstellen</button>
    </form>
  );
}
```

### In deiner API:

```typescript
app.post('/api/tickets', (req, res) => {
  const { titel } = req.body;
  
  // Validierung
  if (!istTitelGueltig(titel)) {
    return res.status(400).json({ 
      error: 'Ungültiger Titel (3-100 Zeichen)' 
    });
  }
  
  // Weiter...
});
```

---

## 📝 Die wichtigsten Konzepte auf einen Blick

| Konzept | Bedeutung | Beispiel |
|---------|-----------|----------|
| `describe()` | Gruppiert zusammengehörige Tests | `describe('Email Validator', ...)` |
| `it()` | Ein einzelner Test-Fall | `it('sollte emails validieren', ...)` |
| `expect()` | Was ich erwarte | `expect(result)` |
| `.toBe()` | Exakte Gleichheit prüfen | `.toBe(true)` |
| AAA | Arrange-Act-Assert Prinzip | Vorbereiten → Ausführen → Prüfen |

---

## ✅ Vorteile von Unit-Tests

1. **Fehler früh erkennen** ⚡
   - Bevor Code in Production geht
   - Beim Entwickeln, nicht beim Deployen

2. **Code sicher ändern** 🛡️
   - Refactoring ohne Angst
   - Tests zeigen sofort wenn etwas kaputt geht

3. **Dokumentation** 📖
   - Tests zeigen, WIE die Funktion funktioniert
   - Besser als Kommentare (Tests können nicht veralten, sie schlagen fehl!)

4. **Selbstvertrauen** 💪
   - Du weißt, dass dein Code funktioniert
   - Alle Edge-Cases sind abgedeckt

5. **Zeit sparen** ⏱️
   - Automatisch statt manuell testen
   - 5 Tests in 6ms statt 5 Minuten manuell klicken

---

## 🎯 Best Practices

### ✅ DO (Mach das):

1. **Ein Test = Ein Konzept**
   ```typescript
   it('sollte kurze Titel ablehnen', () => { ... });
   it('sollte lange Titel ablehnen', () => { ... });
   // Nicht beides in einem Test!
   ```

2. **Aussagekräftige Test-Namen**
   ```typescript
   ✅ it('sollte false für leere Strings zurückgeben', () => ...)
   ❌ it('test1', () => ...)
   ```

3. **Teste Edge-Cases**
   ```typescript
   - Leere Strings
   - null / undefined
   - Sehr lange Strings
   - Sonderzeichen
   ```

4. **Tests einfach halten**
   ```typescript
   // Kurz und klar
   expect(istTitelGueltig('Hi')).toBe(false);
   ```

---

### ❌ DON'T (Vermeide das):

1. **Keine externen Abhängigkeiten**
   ```typescript
   ❌ await fetch('http://api.example.com')  // Das ist ein Integration-Test!
   ✅ istTitelGueltig('Test')                // Das ist ein Unit-Test
   ```

2. **Tests nicht voneinander abhängig**
   ```typescript
   ❌ let sharedData;
      it('test1', () => { sharedData = 'foo'; })
      it('test2', () => { expect(sharedData).toBe('foo'); })
   
   ✅ Jeder Test ist unabhängig!
   ```

3. **Nicht zu kompliziert**
   ```typescript
   ❌ 50 Zeilen Test-Code für 5 Zeilen Funktion
   ✅ Kurze, lesbare Tests
   ```

---

## 🔄 Workflow: Test-Driven Development (TDD)

**Optional, aber empfohlen:**

```
1. Test schreiben (❌ schlägt fehl)
        ↓
2. Funktion implementieren
        ↓
3. Test läuft durch (✅)
        ↓
4. Code verbessern (Refactoring)
        ↓
5. Test läuft immer noch (✅)
```

**Beispiel:**

```typescript
// Schritt 1: Test schreiben (Funktion existiert noch nicht)
it('sollte email validieren', () => {
  expect(istEmailGueltig('test@example.com')).toBe(true);
});
// ❌ FAIL: istEmailGueltig is not defined

// Schritt 2: Funktion implementieren
export function istEmailGueltig(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// ✅ PASS

// Schritt 3: Mehr Tests hinzufügen
it('sollte ungültige email ablehnen', () => {
  expect(istEmailGueltig('ungueltig')).toBe(false);
});
// ✅ PASS
```

---

## 🧩 Weitere Test-Beispiele für dein Projekt

### Email-Validierung

```typescript
describe('Email Validator', () => {
  it('sollte gültige Emails akzeptieren', () => {
    expect(istEmailGueltig('test@example.com')).toBe(true);
    expect(istEmailGueltig('user+tag@domain.co.uk')).toBe(true);
  });

  it('sollte ungültige Emails ablehnen', () => {
    expect(istEmailGueltig('invalid')).toBe(false);
    expect(istEmailGueltig('test@')).toBe(false);
    expect(istEmailGueltig('@example.com')).toBe(false);
  });
});
```

### Ticket-Status Validierung

```typescript
describe('Status Validator', () => {
  it('sollte gültige Status akzeptieren', () => {
    expect(istStatusGueltig('open')).toBe(true);
    expect(istStatusGueltig('in-progress')).toBe(true);
    expect(istStatusGueltig('closed')).toBe(true);
  });

  it('sollte ungültige Status ablehnen', () => {
    expect(istStatusGueltig('invalid')).toBe(false);
    expect(istStatusGueltig('pending')).toBe(false);
  });
});
```

---

## 📚 Zusammenfassung

**Unit-Test in einem Satz:**  
> *"Ich teste, ob eine einzelne Funktion bei verschiedenen Eingaben die erwarteten Ergebnisse liefert."*

**Die 3 Schritte:**
1. **ARRANGE** - Vorbereiten
2. **ACT** - Ausführen  
3. **ASSERT** - Überprüfen

**Warum wichtig?**
- ✅ Fehler früh finden
- ✅ Code sicher ändern
- ✅ Dokumentation
- ✅ Zeitersparnis

**Nächste Schritte:**
1. Probiere die Tests aus: `npm test tests/units/agents.test.ts`
2. Schreibe eigene Tests für andere Funktionen
3. Nutze die getesteten Funktionen in deiner App

---

## 🔗 Weitere Ressourcen

- [Vitest Dokumentation](https://vitest.dev/)
- [Die Test-Files in diesem Projekt](../tests/)
- [Integration Tests Beispiele](../tests/integrations/)
- [Supertest Guide](SUPERTEST_GUIDE.md)
