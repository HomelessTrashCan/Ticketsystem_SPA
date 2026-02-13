# Architektur-Erklärung: Development vs. Production Setup

## Überblick

Dieses Dokument erklärt die Architektur-Änderungen, die vorgenommen wurden, um die Ticket-Anwendung korrekt zum Laufen zu bringen.

## Das Problem vorher

### 1. API-Aufrufe gingen an den falschen Server

**Vorher:**
```typescript
// In App.tsx - OHNE VITE_API_URL
fetch('/api/tickets')  // Relative URL
```

**Was passierte:**
- Browser lädt die Seite von `http://localhost:5173` (Vite Dev Server)
- `fetch('/api/tickets')` wird zu `http://localhost:5173/api/tickets`
- ❌ Der Vite Dev Server hat keine API-Routes - **404 Fehler**

**Warum?**
- Relative URLs (ohne `http://...`) werden vom Browser relativ zur **aktuellen Seiten-URL** aufgelöst
- Die Seite läuft auf Port 5173, also gehen Requests auch dorthin
- Der Backend-Server auf Port 8080 wurde nie erreicht

### 2. Backend versuchte Frontend zu serven (in Development)

**Vorher in `server/index.js`:**
```javascript
// Diese Zeilen waren IMMER aktiv:
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
```

**Was passierte:**
- Im Development-Modus existiert der `dist/` Ordner nicht
- Express versuchte `dist/index.html` zu senden
- ❌ **Fehler: Cannot find /dist/index.html**

### 3. OAuth Redirect ging zum Backend-Port

**Vorher in `server/api/auth.js`:**
```javascript
// Diese Zeile überschrieb die .env Variable:
if (frontendUrl.includes('localhost') || frontendUrl.includes('localhost')) {
  frontendUrl = 'http://localhost:8080';  // ❌ Falsch!
}
```

**Was passierte:**
- Nach erfolgreicher Google-Authentifizierung
- Redirect zu `http://localhost:8080/?token=...`
- ❌ Backend-Port hat kein UI - **leere Seite**

## Die Lösung

### 1. VITE_API_URL für explizite Backend-Aufrufe

**Neu in `.env`:**
```bash
VITE_API_URL=http://localhost:8080
```

**Neu in `App.tsx`:**
```typescript
const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Alle API-Calls verwenden nun absolute URLs:
fetch(`${API_BASE}/api/tickets`, {
  headers: getAuthHeaders()
})
```

**Warum `VITE_` Prefix?**
- **Sicherheit:** Vite exponiert nur Variablen mit `VITE_` Prefix an den Browser
- Server-only Secrets (wie `JWT_SECRET`, `MONGO_URI`) bleiben verborgen
- Verhindert versehentliches Leaken von Credentials ins Frontend

**Was passiert jetzt:**
1. Browser lädt Seite von `http://localhost:5173` (Vite)
2. `fetch('http://localhost:8080/api/tickets')` - **exakte URL zum Backend**
3. ✅ Request kommt am richtigen Server an

### 2. Conditional Static File Serving

**Neu in `server/index.js`:**
```javascript
if (process.env.NODE_ENV === 'production') {
  // Nur in Production: Serve gebuildete Frontend-Dateien
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
  console.log('Production mode: Serving frontend from dist/');
} else {
  console.log('Development mode: Frontend served by Vite');
}
```

**Was das bewirkt:**
- **Development:** Backend = nur API-Server, kein Static Serving
- **Production:** Backend = API + Static File Server für `dist/`

### 3. OAuth Redirect zur korrekten Frontend-URL

**`.env` Update:**
```bash
FRONTEND_URL=http://localhost:5173  # Geändert von 5174
```

**`server/api/auth.js` Fix:**
```javascript
// Override-Logik entfernt:
const frontendUrl = process.env.FRONTEND_URL;
// Kein if-Statement mehr - verwendet direkt die .env Variable
```

## Development vs. Production Architektur

### Development Setup (2 Server)

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  http://localhost:5173 (lädt UI aus Vite)              │
└────────┬──────────────────────────────┬─────────────────┘
         │                              │
         │ UI-Dateien (HTML, JS, CSS)   │ API-Calls
         │ mit Hot Module Replacement   │ (fetch mit VITE_API_URL)
         │                              │
         V                              V
┌────────────────────┐        ┌────────────────────────┐
│   Vite Dev Server  │        │   Express Backend      │
│   Port 5173        │        │   Port 8080            │
│                    │        │                        │
│ - Serves Source    │        │ - /api/tickets         │
│ - HMR WebSocket    │        │ - /api/auth/...        │
│ - Transpiling      │        │ - /api/agents          │
│ - TypeScript       │        │ - MongoDB Connection   │
└────────────────────┘        │ - JWT Authentication   │
                              │ - CORS enabled         │
                              └────────────────────────┘
```

**Warum 2 Server?**
- **Vite:** Schnelles Hot Module Replacement (HMR) für Development
- **Express:** API-Logik mit Datenbank, Auth, Business Logic
- **Getrennte Concerns:** UI-Entwicklung ≠ API-Entwicklung

**CORS notwendig?**
- ✅ **JA** - Browser sieht `localhost:5173` → `localhost:8080` als **Cross-Origin**
- Unterschiedlicher Port = unterschiedliche Origin
- CORS-Header erlaubt Cross-Origin Requests

### Production Setup (1 Server)

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  https://yourapp.azurewebsites.net                     │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Alle Requests (UI + API)
                             │
                             V
                   ┌─────────────────────┐
                   │   Express Backend   │
                   │   Port 8080         │
                   │                     │
                   │ Static Files:       │
                   │ - /dist/index.html  │
                   │ - /dist/assets/*    │
                   │                     │
                   │ API Routes:         │
                   │ - /api/tickets      │
                   │ - /api/auth/...     │
                   │ - /api/agents       │
                   │                     │
                   │ MongoDB + JWT       │
                   └─────────────────────┘
```

**Warum 1 Server?**
- **Einfachheit:** Nur ein Deployment (Azure App Service)
- **Keine CORS:** Alle Requests zur gleichen Origin
- **Kosten:** Ein Server statt zwei
- **Vite nicht nötig:** Gebuildete Dateien brauchen kein HMR

**Wie funktioniert's?**
1. `npm run build` → Vite erstellt `dist/` Ordner
2. Express seriert `dist/` als statische Dateien
3. Alle unbekannten Routes → `dist/index.html` (SPA Routing)

## Vorher/Nachher Vergleich

| Aspekt | Vorher (❌ Broken) | Nachher (✅ Working) |
|--------|-------------------|---------------------|
| **API Calls** | `fetch('/api/tickets')` → Port 5173 | `fetch('http://localhost:8080/api/tickets')` → Port 8080 |
| **Backend in Dev** | Versucht `dist/` zu serven → Fehler | Nur API-Routes, kein Static Serving |
| **OAuth Redirect** | → Port 8080 (Backend) | → Port 5173 (Frontend) |
| **Environment Vars** | Keine Frontend-Konfiguration | `VITE_API_URL` für Browser |
| **CORS** | Eventuell nicht konfiguriert | Explizit für localhost:5173 aktiviert |
| **Development** | 1 Server versuchte alles | 2 Server: Vite (UI) + Express (API) |
| **Production** | Unkonfiguriert | 1 Server: Express seriert `dist/` + API |

## Wichtige Konzepte

### Vite Environment Variables

```bash
# .env

# ❌ Nicht vom Browser zugänglich (server-only):
JWT_SECRET=your-secret
MONGO_URI=mongodb+srv://...
SESSION_SECRET=session-secret

# ✅ Vom Browser zugänglich (VITE_ Prefix):
VITE_API_URL=http://localhost:8080
```

**Im Code:**
```typescript
// Frontend (Browser):
import.meta.env.VITE_API_URL  // ✅ Funktioniert
import.meta.env.JWT_SECRET    // ❌ undefined

// Backend (Node.js):
process.env.JWT_SECRET         // ✅ Funktioniert
process.env.VITE_API_URL       // ✅ Funktioniert auch
```

### Relative vs. Absolute URLs

```typescript
// Relative URL (verwendet Browser-Location):
fetch('/api/tickets')
// Browser auf localhost:5173 → localhost:5173/api/tickets ❌

// Absolute URL (exakte Ziel-Adresse):
fetch('http://localhost:8080/api/tickets')
// → localhost:8080/api/tickets ✅
```

### CORS (Cross-Origin Resource Sharing)

**Warum notwendig?**
- Browser-Security verhindert Requests zwischen verschiedenen Origins
- Origin = Protokoll + Domain + Port
- `http://localhost:5173` ≠ `http://localhost:8080` (unterschiedlicher Port)

**Backend Config:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite Dev Server
    'http://localhost:5174',  // Backup Port
    'http://localhost:5175',  // Backup Port
    'https://yourapp.azurewebsites.net'  // Production
  ],
  credentials: true
}));
```

## Zusammenfassung

### Was wurde geändert:

1. **`.env` Datei:**
   - `VITE_API_URL=http://localhost:8080` hinzugefügt
   - `FRONTEND_URL=http://localhost:5173` korrigiert

2. **`App.tsx`:**
   - Alle `fetch()` Calls verwenden `${API_BASE}/api/...`
   - React Hooks in Component verschoben (nicht global)
   - API Response Parsing für `{data: [], pagination: {}}` Format

3. **`server/index.js`:**
   - Static File Serving nur in Production (`NODE_ENV === 'production'`)
   - Development Mode seriert nur API-Routes

4. **`server/api/auth.js`:**
   - Localhost Override entfernt
   - Verwendet `FRONTEND_URL` aus `.env` direkt

### Warum ist es nun besser:

✅ **Klare Trennung:** Frontend (Vite) und Backend (Express) haben definierte Rollen  
✅ **Explizite Konfiguration:** URLs sind nicht implizit, sondern konfigurierbar  
✅ **Development Workflow:** Hot Reload für UI, stabile API  
✅ **Production Ready:** Ein Server macht alles, korrekt konfiguriert  
✅ **Sicherheit:** Secrets bleiben server-only, nur notwendige Vars im Browser  
✅ **Fehlerfreiheit:** OAuth Redirect korrekt, API Calls erreichen Backend  

---

**Dokumentiert am:** 13. Februar 2026  
**Projekt:** Ticketsystem SPA  
**Technologien:** Vite 7.3.1, Express 5.2.1, React 19.2.0, MongoDB Atlas
