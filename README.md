# Ticket System SPA

Ein modernes Ticket-Management-System mit React (Vite) Frontend und Node.js/Express Backend mit MongoDB Atlas Integration und Google OAuth Authentifizierung.

## 🚀 Features

- ✅ **Google OAuth Authentifizierung**: Sichere Anmeldung mit Google-Konto
- ✅ **Ticket Management**: Erstellen, Bearbeiten, Löschen von Tickets
- ✅ **Agent-Verwaltung**: Zuweisung von Tickets an Agents
- ✅ **Sequenzielle IDs**: Automatische Ticket-ID-Generierung (T-1001, T-1002, ...)
- ✅ **MongoDB Integration**: Persistente Datenspeicherung in MongoDB Atlas
- ✅ **Real-time Updates**: Live-Aktualisierung der Ticket-Liste
- ✅ **Responsive Design**: Funktioniert auf Desktop und Mobile
- ✅ **Automated Testing**: Unit und Integration Tests mit Vitest
- ✅ **CI/CD Pipeline**: GitHub Actions für automatische Tests und Deployment

## ⚡ Quick Start

Folgen Sie diesen Schritten für einen schnellen Start:

### 1️⃣ **Projekt klonen und Dependencies installieren**

```bash
git clone <repository-url>
cd Ticketsystem_SPA
npm install
```

### 2️⃣ **Umgebungsvariablen konfigurieren**

Erstellen Sie eine `.env` Datei basierend auf `.env.example`:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Öffnen Sie `.env` und füllen Sie **alle** erforderlichen Werte aus:

```env
# MongoDB Connection (siehe Abschnitt "MongoDB Setup" unten)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=TicketSystem

# Google OAuth (siehe Abschnitt "Google OAuth Setup" unten)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Callback URL für lokale Entwicklung
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# Secrets generieren mit PowerShell:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=generate-random-32-byte-hex-string
JWT_SECRET=generate-random-32-byte-hex-string

# Server Configuration
PORT=8080
NODE_ENV=development

# Frontend URL für lokale Entwicklung
FRONTEND_URL=http://localhost:5174
```

> ⚠️ **Wichtig:** Diese `.env` Datei ist nur für **lokale Entwicklung**. Für Production müssen die Umgebungsvariablen in Azure App Service konfiguriert werden (siehe [Deployment-Sektion](#-deployment-auf-azure)).

### 3️⃣ **Datenbank initialisieren**

```bash
npm run seed
```

### 4️⃣ **Anwendung starten**

```bash
npm run dev:all
```

✅ **Fertig!** Die Anwendung läuft auf:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080

---

## 📋 Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass Sie folgendes haben:

- ✅ **Node.js 20+** - [Download](https://nodejs.org/)
- ✅ **MongoDB Atlas Account** (kostenlos) - [Registrieren](https://www.mongodb.com/cloud/atlas/register)
- ✅ **Google Cloud Account** (kostenlos) - [Anmelden](https://console.cloud.google.com/)
- ✅ **Git** - [Download](https://git-scm.com/)

---

## 🗄️ MongoDB Atlas Setup

### Schritt 1: MongoDB Atlas Cluster erstellen

1. Gehen Sie zu [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Registrieren Sie sich / Melden Sie sich an
3. Klicken Sie auf **"Create"** → **"Shared"** (kostenlos)
4. Wählen Sie eine Region (z.B. Frankfurt, Europe)
5. Klicken Sie auf **"Create Cluster"**

### Schritt 2: Database User erstellen

1. Klicken Sie im linken Menü auf **"Database Access"**
2. Klicken Sie auf **"Add New Database User"**
3. Wählen Sie **"Password"** als Authentication Method
4. Username eingeben (z.B. `ticketuser`)
5. Klicken Sie auf **"Autogenerate Secure Password"** und **kopieren** Sie das Passwort
6. Database User Privileges: **"Read and write to any database"**
7. Klicken Sie auf **"Add User"**

### Schritt 3: Network Access konfigurieren

1. Klicken Sie im linken Menü auf **"Network Access"**
2. Klicken Sie auf **"Add IP Address"**
3. Klicken Sie auf **"Allow Access from Anywhere"** (für Entwicklung)
4. Klicken Sie auf **"Confirm"**

> ⚠️ **Hinweis:** Für Production sollten Sie nur spezifische IPs whitelisten!

### Schritt 4: Connection String kopieren

1. Klicken Sie auf **"Database"** im linken Menü
2. Klicken Sie auf **"Connect"** bei Ihrem Cluster
3. Wählen Sie **"Connect your application"**
4. Kopieren Sie den Connection String
5. Ersetzen Sie `<username>` und `<password>` mit Ihren Credentials
6. Fügen Sie den String in Ihre `.env` Datei ein:

```env
MONGO_URI=mongodb+srv://ticketuser:IhrPasswort@cluster0.xxxxx.mongodb.net/?appName=TicketSystem
```

---

## 🔐 Google OAuth Setup

### Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
2. Klicken Sie auf **"Projekt erstellen"** (oder wählen Sie ein bestehendes)
3. Geben Sie einen Projektnamen ein (z.B. "Ticket System")
4. Klicken Sie auf **"Erstellen"**

### Schritt 2: OAuth Consent Screen konfigurieren

1. Im linken Menü: **"APIs & Services"** → **"OAuth consent screen"**
2. Wählen Sie **"External"** und klicken Sie auf **"Create"**
3. **App-Informationen:**
   - App name: `Ticket System`
   - User support email: Ihre E-Mail
   - Developer contact: Ihre E-Mail
4. Klicken Sie auf **"Save and Continue"**
5. **Scopes:** Klicken Sie auf **"Save and Continue"** (keine Änderungen)
6. **Test users:** Optional, Test-User hinzufügen
7. Klicken Sie auf **"Save and Continue"**

### Schritt 3: OAuth 2.0 Client ID erstellen

1. Im linken Menü: **"APIs & Services"** → **"Credentials"**
2. Klicken Sie auf **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Ticket System Local`
5. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `http://localhost:8080`
6. **Authorized redirect URIs:**
   - `http://localhost:8080/api/auth/google/callback`
7. Klicken Sie auf **"Create"**
8. **Kopieren** Sie Client ID und Client Secret
9. Fügen Sie diese in Ihre `.env` Datei ein:

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

---

## 🛠️ Secrets generieren

Session- und JWT-Secrets sollten zufällig und sicher sein:

### PowerShell (Windows):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bash (Linux/Mac):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Führen Sie den Befehl **zweimal** aus und fügen Sie die Werte in `.env` ein:
```env
SESSION_SECRET=a8d78f718eb2a33884b8c92223cdfb9b0b2705b82b3dfe02638998242714f492
JWT_SECRET=c5f8298e5032f542ab80738069a56b54f5c7ad39402748fb6dda0e8e5e926cd1
```

---

## 🏃 Entwicklung

### Frontend und Backend gleichzeitig starten

```bash
npm run dev:all
```

Dies startet:
- **Vite Dev Server** auf `http://localhost:5173`
- **Backend API Server** auf `http://localhost:8080`

### Nur Frontend starten

```bash
npm run dev
```

### Nur Backend starten

```bash
npm start
```

---

## 🧪 Testing

Stellen Sie sicher, dass der Backend-Server läuft, bevor Sie Tests ausführen!

### Alle Tests ausführen

```bash
npm test
```

### Tests im Watch-Modus

```bash
npm run test:watch
```

### Tests mit Coverage

```bash
npm run test:coverage
```

Mehr Informationen: [tests/README.md](tests/README.md)

---

## 📦 Production Build

### Build erstellen

```bash
npm run build
```

Build-Output wird in `dist/` erstellt.

### Build lokal testen

```bash
npm run preview
```

---
## 📂 Projektstruktur

```
Ticketsystem_SPA/
├── src/
│   ├── server/                    # Backend (Node.js/Express)
│   │   ├── api/                   # API Routes
│   │   │   ├── agents.js          # GET /api/agents
│   │   │   ├── tickets.js         # CRUD /api/tickets
│   │   │   └── auth.js            # Google OAuth /api/auth
│   │   ├── config/                # Konfiguration
│   │   │   └── passport.js        # Passport.js Setup
│   │   ├── middleware/            # Express Middleware
│   │   │   └── auth.js            # JWT Auth Middleware
│   │   ├── models/                # Datenbank Models
│   │   │   └── user.js            # User Model
│   │   ├── rbac/                  # Role-Based Access Control
│   │   │   └── roles.js           # Rollen & Permissions
│   │   ├── db.js                  # MongoDB Connection
│   │   ├── index.js               # Express Server Entry Point
│   │   └── seed.mjs               # Datenbank Seed Script
│   ├── components/                # React Components
│   │   ├── Login.tsx              # Login Component
│   │   └── ProtectedRoute.tsx     # Route Guard
│   ├── context/                   # React Context
│   │   └── AuthContext.tsx        # Auth State Management
│   ├── rbac/                      # Frontend RBAC
│   │   └── permissions.ts         # Permission Checks
│   ├── App.tsx                    # React Main App
│   └── main.tsx                   # React Entry Point
├── tests/                         # Vitest Tests
│   ├── units/                     # Unit Tests
│   └── integrations/              # Integration Tests
├── .github/workflows/             # GitHub Actions CI/CD
├── .env.example                   # Environment Template
├── package.json                   # Dependencies & Scripts
└── README.md                      # Diese Datei
```

---

## 🌐 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - OAuth callback handler
- `GET /api/auth/me` - Get current user info (requires JWT)
- `POST /api/auth/logout` - Logout

### Tickets
- `GET /api/tickets` - Alle Tickets abrufen
- `POST /api/tickets` - Neues Ticket erstellen
- `PUT /api/tickets/:id` - Ticket aktualisieren
- `DELETE /api/tickets/:id` - Ticket löschen

### Agents
- `GET /api/agents` - Alle Agent-E-Mails abrufen

**API läuft auf:** `http://localhost:8080`

Detaillierte API-Dokumentation: [docs/API.md](docs/API.md)

---

## 🔧 Verfügbare NPM Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet Vite Dev Server (Frontend) |
| `npm start` | Startet Backend Server |
| `npm run dev:all` | Startet Frontend + Backend gleichzeitig |
| `npm run build` | Erstellt Production Build |
| `npm test` | Führt alle Tests aus |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run test:coverage` | Tests mit Coverage-Report |
| `npm run seed` | Initialisiert Datenbank mit Test-Daten |
| `npm run lint` | Führt ESLint aus |
| `npm run preview` | Vorschau des Production Builds |

---

## 🗄️ Datenbank Details

### MongoDB Collections

- **`tickets`** - Alle Tickets mit sequenziellen IDs
- **`agents`** - Alle verfügbaren Agents
- **`users`** - OAuth User-Daten
- **`counters`** - Sequenz-Zähler für Ticket-IDs

### Seed-Daten

Das Seed-Script initialisiert die Datenbank mit Demo-Daten:

```bash
npm run seed
```

**Quellen:**
- `src/data/tickethistory.json` → Tickets
- `src/data/agents.json` → Agents

---

## 🐛 Troubleshooting

### ❌ Server startet nicht: "SESSION_SECRET is not set"

**Lösung:** Stellen Sie sicher, dass alle erforderlichen Umgebungsvariablen in der `.env` Datei gesetzt sind:
```bash
# Überprüfen Sie, ob .env existiert
cat .env  # Linux/Mac
type .env  # Windows
```

### ❌ "Cannot connect to MongoDB"

**Mögliche Ursachen:**
1. MONGO_URI ist falsch oder fehlt
2. MongoDB Atlas IP-Whitelist blockiert Ihre IP
3. Netzwerkprobleme

**Lösung:**
- Überprüfen Sie Ihre `MONGO_URI` in der `.env` Datei
- MongoDB Atlas → Network Access → "Allow Access from Anywhere" (für Entwicklung)
- Testen Sie die Verbindung: `node src/server/db.js`

### ❌ Google OAuth funktioniert nicht

**Mögliche Ursachen:**
1. GOOGLE_CLIENT_ID oder GOOGLE_CLIENT_SECRET fehlt/falsch
2. Redirect URI nicht in Google Cloud Console konfiguriert

**Lösung:**
- Überprüfen Sie Ihre Google OAuth Credentials in `.env`
- Google Cloud Console → APIs & Services → Credentials
- Stellen Sie sicher, dass `http://localhost:8080/api/auth/google/callback` als Redirect URI eingetragen ist

### ❌ Tests schlagen fehl

**Mögliche Ursachen:**
1. Backend-Server läuft nicht
2. Datenbank nicht initialisiert
3. Falsche Port-Konfiguration

**Lösung:**
```bash
# Terminal 1: Backend starten
npm start

# Terminal 2: Tests ausführen
npm test
```

### ❌ Frontend zeigt keine Daten

**Lösung:**
- Öffnen Sie Browser DevTools (F12)
- Prüfen Sie die Console auf Fehler
- Prüfen Sie den Network-Tab auf fehlgeschlagene API-Requests
- Stellen Sie sicher, dass Backend auf Port 8080 läuft

---

## 🚢 Deployment auf Azure

Das Projekt ist für Deployment auf Azure Web Apps konfiguriert.

> 📖 **Ausführliche Production-Anleitung:** [PRODUCTION.md](PRODUCTION.md)

### Voraussetzungen
- Azure Account
- Web App erstellt

### Umgebungsvariablen in Azure setzen

Azure Portal → Ihre Web App → **Configuration** → **Application settings**

Fügen Sie folgende Variablen hinzu:

| Name | Beispielwert (Production) | Beschreibung |
|------|---------------------------|---------------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=TicketSystem` | MongoDB Connection String |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Aus Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | Aus Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://ihre-app.azurewebsites.net/api/auth/google/callback` | ⚠️ **Production URL** (NICHT localhost!) |
| `SESSION_SECRET` | `random-32-byte-hex-string` | Sicher generiertes Secret |
| `JWT_SECRET` | `random-32-byte-hex-string` | Sicher generiertes Secret |
| `FRONTEND_URL` | `https://ihre-app.azurewebsites.net` | ⚠️ **Production URL** (NICHT localhost!) |
| `NODE_ENV` | `production` | Environment |
| `PORT` | `8080` | Port (optional, Azure setzt dies oft automatisch) |

### Google OAuth für Production konfigurieren

**Wichtig:** Sie müssen **beide** URLs (lokal + production) in Google Cloud Console eintragen!

1. Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials** → Ihr OAuth Client → **Edit**
3. **Authorized redirect URIs** - Fügen Sie **BEIDE** hinzu:
   - ✅ `http://localhost:8080/api/auth/google/callback` (für lokale Entwicklung)
   - ✅ `https://ihre-app.azurewebsites.net/api/auth/google/callback` (für Production)
4. **Save** klicken

> 💡 **Tipp:** Ersetzen Sie `ihre-app.azurewebsites.net` mit Ihrer tatsächlichen Azure App URL.

Mehr Details: [.github/CI-CD.md](.github/CI-CD.md)

---

## 📚 Weitere Dokumentation

- **[API Dokumentation](docs/API.md)** - Detaillierte API-Endpunkt-Beschreibungen
- **[RBAC Dokumentation](docs/RBAC.md)** - Role-Based Access Control System
- **[Production Deployment](PRODUCTION.md)** - ⚠️ **Umgebungsvariablen für Azure Production**
- **[CI/CD Setup](.github/CI-CD.md)** - GitHub Actions & Azure Deployment
- **[Test Dokumentation](tests/README.md)** - Testing Guide
- **[Contributing Guide](CONTRIBUTING.md)** - Wie Sie zum Projekt beitragen können

---

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

---

## 📝 Lizenz

ISC

---

## 💡 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die [Troubleshooting](#-troubleshooting) Sektion
2. Schauen Sie in die [Dokumentation](#-weitere-dokumentation)
3. Öffnen Sie ein Issue auf GitHub
