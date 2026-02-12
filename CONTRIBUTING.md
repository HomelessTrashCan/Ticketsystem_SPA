# Contributing Guide

Vielen Dank für Ihr Interesse, zu diesem Projekt beizutragen! 🎉

## 🚀 Erste Schritte

1. **Forken Sie das Repository** auf GitHub
2. **Klonen Sie Ihr Fork**:
   ```bash
   git clone https://github.com/your-username/Ticketsystem_SPA.git
   cd Ticketsystem_SPA
   ```
3. **Folgen Sie der Setup-Anleitung** in der [README.md](README.md)
4. **Erstellen Sie einen Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 📝 Development Workflow

### 1. Änderungen vornehmen

- Halten Sie Änderungen fokussiert und atomar
- Folgen Sie dem bestehenden Code-Stil
- Fügen Sie Kommentare hinzu, wo nötig
- Aktualisieren Sie die Dokumentation bei Bedarf

### 2. Tests ausführen

Stellen Sie sicher, dass alle Tests erfolgreich laufen:

```bash
# Backend starten
npm start

# In einem neuen Terminal: Tests ausführen
npm test
```

### 3. Code-Qualität prüfen

```bash
# Linting
npm run lint

# TypeScript Type-Checking (falls vorhanden)
npm run build
```

### 4. Committen

Verwenden Sie aussagekräftige Commit-Messages:

```bash
git add .
git commit -m "feat: Add ticket priority filter"
```

**Commit Message Format:**
- `feat:` Neue Features
- `fix:` Bug Fixes
- `docs:` Nur Dokumentation
- `style:` Code-Formatierung (keine Logik-Änderungen)
- `refactor:` Code-Umstrukturierung
- `test:` Tests hinzufügen/ändern
- `chore:` Build-Process, Dependencies, etc.

### 5. Pull Request erstellen

1. **Pushen Sie Ihren Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```

2. **Öffnen Sie einen Pull Request** auf GitHub

3. **Beschreiben Sie Ihre Änderungen**:
   - Was wurde geändert?
   - Warum wurde es geändert?
   - Wie wurde es getestet?

## 🧪 Testing Guidelines

- Schreiben Sie Tests für neue Features
- Aktualisieren Sie Tests bei Änderungen
- Tests sollten unabhängig und reproduzierbar sein
- Verwenden Sie beschreibende Test-Namen

**Beispiel:**
```typescript
describe('Tickets API', () => {
  it('should create a new ticket with sequential ID', async () => {
    // Test implementation
  });
});
```

## 📁 Projekt-Struktur

Bitte beachten Sie die bestehende Struktur:

```
src/
├── server/           # Backend Code
│   ├── api/          # API Routes
│   ├── models/       # Datenbank Models
│   └── middleware/   # Express Middleware
├── components/       # React Components
└── context/         # React Context

tests/
├── units/           # Unit Tests
└── integrations/    # Integration Tests
```

## 🔒 Sicherheit

- **Niemals** echte Credentials committen
- Verwenden Sie `.env.example` für Beispiel-Konfigurationen
- Nutzen Sie Environment Variables für sensitive Daten
- Überprüfen Sie Ihre Changes vor dem Commit:
  ```bash
  git diff --cached
  ```

## 📋 Code Style Guidelines

### TypeScript/JavaScript

- Verwenden Sie TypeScript, wo möglich
- 2 Spaces für Einrückung
- Verwenden Sie `const` statt `let`, wo möglich
- Vermeiden Sie `any` types
- Fügen Sie JSDoc-Kommentare für komplexe Funktionen hinzu

### React

- Verwenden Sie Functional Components
- Verwenden Sie Hooks für State Management
- Komponenten-Namen in PascalCase
- Props-Interface definieren

**Beispiel:**
```tsx
interface TicketCardProps {
  ticket: Ticket;
  onUpdate: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onUpdate }: TicketCardProps) {
  // Component implementation
}
```

## 🐛 Bug Reports

Wenn Sie einen Bug finden:

1. **Prüfen Sie**, ob der Bug bereits als Issue existiert
2. **Erstellen Sie ein neues Issue** mit:
   - Beschreibung des Problems
   - Schritte zur Reproduktion
   - Erwartetes vs. tatsächliches Verhalten
   - Screenshots (falls hilfreich)
   - Ihre Umgebung (OS, Node-Version, etc.)

## 💡 Feature Requests

Für neue Features:

1. **Erstellen Sie ein Issue** mit dem Label "enhancement"
2. **Beschreiben Sie**:
   - Das Problem, das gelöst werden soll
   - Ihren Lösungsvorschlag
   - Mögliche Alternativen
   - Zusätzlicher Kontext

## ❓ Fragen?

Bei Fragen:
- Schauen Sie in die [README.md](README.md)
- Lesen Sie die [Dokumentation](docs/)
- Öffnen Sie ein Issue mit dem Label "question"

## 📜 License

Durch Ihren Beitrag stimmen Sie zu, dass Ihre Arbeit unter der gleichen Lizenz wie das Projekt veröffentlicht wird (ISC).

---

**Vielen Dank für Ihren Beitrag! 🙌**
