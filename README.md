# 🎫 Ticket System

> Modernes Help Desk & Support Ticketsystem mit Role-Based Access Control (RBAC)

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.1-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

---

## 📋 Inhaltsverzeichnis

- [Überblick](#-überblick)
- [Features](#-features)
- [Technologie-Stack](#-technologie-stack)
- [Installation](#-installation)
- [Konfiguration](#-konfiguration)
- [Verwendung](#-verwendung)
- [RBAC-System](#-rbac-system)
- [API-Dokumentation](#-api-dokumentation)
- [Projektstruktur](#-projektstruktur)
- [Tests](#-tests)
- [Deployment](#-deployment)

---

## 🎯 Überblick

Das **Ticket System** ist eine vollständige Single-Page-Application (SPA) für Help Desk und Support-Management. Es bietet ein ausgereiftes Berechtigungssystem (RBAC), Echtzeit-Updates und eine moderne Benutzeroberfläche.

### Hauptmerkmale

- 🔐 **Sichere Authentifizierung** via Google OAuth 2.0
- 👥 **Rollenbasierte Zugriffskontrolle** (RBAC) mit 4 Rollen
- ⚡ **Optimistic UI Updates** für schnelle Benutzererfahrung
- 🔍 **Erweiterte Filter & Suche** mit Volltextsuche
- 📊 **Pagination** für große Datenmengen
- ✅ **Server- & Client-seitige Validierung**
- 🧪 **Unit-Tests** mit Vitest

---

## ✨ Features

### 1. Ticket-Management

- ✏️ Tickets erstellen, bearbeiten und löschen
- 🔢 Sequentielle Ticket-IDs (z.B. `T-1001`, `T-1002`)
- 📌 Status-Verwaltung: `open`, `in_progress`, `closed`
- 🚦 Prioritäten: `low`, `medium`, `high`
- 💬 Kommentarfunktion mit Zeitstempeln
- 🔄 Optimistic UI Updates mit automatischem Rollback bei Fehlern

### 2. RBAC (Role-Based Access Control)

Granulare Berechtigungen für verschiedene Benutzerrollen:

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| **Admin** | Vollzugriff auf alle Funktionen | Alle Permissions |
| **Support** | Support-Mitarbeiter | Tickets verwalten, zuweisen, Prioritäten setzen |
| **User** | Standard-Benutzer | Eigene Tickets erstellen und bearbeiten |
| **Readonly** | Nur Lesezugriff | Nur eigene Tickets anzeigen |

### 3. Filter & Suche

- 🔍 **Volltextsuche** über Ticket-ID, Titel, Beschreibung, Requester und Assignee
- 🎯 **Filter** nach Status, Priorität und Assignee
- 👤 **"Nur eigene Tickets"** Ansicht
- 📄 **Pagination** (50 Tickets pro Seite)
- 🔄 **Filter zurücksetzen** Button

### 4. Authentifizierung

- 🔐 Google OAuth 2.0 Login
- 🎫 JWT-Token-basierte Session-Verwaltung
- 🛡️ Protected Routes (nur für authentifizierte Benutzer)
- 🚪 Sichere Abmeldung

### 5. Validierung

Server- und clientseitige Validierung mit Unit-Tests:

- **Titel:** 3-100 Zeichen
- **Beschreibung:** 3-100 Zeichen
- **Kommentare:** Max. 500 Zeichen

---

## 🛠 Technologie-Stack

### Frontend
- **React 19.2** - UI-Framework mit React Compiler
- **TypeScript 5.9** - Type Safety
- **Vite 7.2** - Build Tool & Dev Server
- **ESLint** - Code-Qualität

### Backend
- **Node.js 20+** - JavaScript Runtime
- **Express 5.2** - Web Framework
- **Passport.js** - Authentifizierung
- **MongoDB 7.1** - NoSQL-Datenbank
- **JWT** - Token-basierte Authentifizierung

### Testing
- **Vitest 4.0** - Unit & Integration Tests
- **Supertest 7.2** - API-Tests

---

## 📦 Installation

### Voraussetzungen

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB Atlas Account oder lokale MongoDB-Instanz
- Google OAuth 2.0 Credentials

### Schritt 1: Repository klonen

```bash
git clone https://github.com/your-username/ticketsystem.git
cd ticketsystem
```

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Projektroot:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ticketsystem

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Session Secret
SESSION_SECRET=your-super-secret-session-key

# JWT
JWT_SECRET=your-jwt-secret

# API URL (Frontend)
VITE_API_URL=http://localhost:3000
```

### Schritt 4: Datenbank initialisieren (optional)

```bash
npm run seed
```

---

## ⚙️ Konfiguration

### Google OAuth 2.0 einrichten

1. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt
3. Aktivieren Sie die **Google+ API**
4. Erstellen Sie OAuth 2.0 Credentials
5. Fügen Sie die Callback-URL hinzu: `http://localhost:3000/api/auth/google/callback`
6. Kopieren Sie Client ID und Client Secret in die `.env` Datei

### MongoDB Atlas einrichten

1. Erstellen Sie einen kostenlosen Account auf [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Erstellen Sie ein Cluster
3. Fügen Sie Ihre IP-Adresse zur Whitelist hinzu
4. Erstellen Sie einen Datenbank-Benutzer
5. Kopieren Sie die Connection String in die `.env` Datei

---

## 🚀 Verwendung

### Development-Modus

**Frontend & Backend gleichzeitig starten:**

```bash
npm run dev:all
```

**Nur Frontend:**

```bash
npm run dev
```

**Nur Backend:**

```bash
npm run start:dev
```

### Production-Build

```bash
# Build erstellen
npm run build

# Production-Server starten
npm run start
```

### Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet Vite Dev Server (Port 5173) |
| `npm run dev:all` | Startet Frontend + Backend parallel |
| `npm run build` | Erstellt Production-Build |
| `npm run start` | Startet Production-Server |
| `npm run test` | Führt Unit-Tests aus |
| `npm run test:watch` | Führt Tests im Watch-Modus aus |
| `npm run test:coverage` | Erstellt Test-Coverage-Report |
| `npm run lint` | Führt ESLint aus |
| `npm run seed` | Initialisiert Datenbank mit Testdaten |

---

## 🔐 RBAC-System

### Rollenübersicht

#### Admin
Volle Kontrolle über das gesamte System.

**Permissions:**
- ✅ Tickets erstellen, bearbeiten, löschen
- ✅ Alle Tickets sehen und bearbeiten
- ✅ Tickets zuweisen und Prioritäten ändern
- ✅ Status ändern (alle Tickets)
- ✅ Kommentare auf geschlossenen Tickets hinzufügen
- ✅ Benutzer verwalten (über MongoDB)

#### Support
Erweiterte Rechte für Support-Mitarbeiter.

**Permissions:**
- ✅ Tickets erstellen und bearbeiten
- ✅ Alle Tickets sehen
- ✅ Tickets zuweisen und Prioritäten ändern
- ✅ Status ändern (alle Tickets)
- ✅ Kommentare auf geschlossenen Tickets hinzufügen
- ❌ Tickets löschen
- ❌ Benutzer verwalten

#### User
Standard-Benutzer mit Basis-Rechten.

**Permissions:**
- ✅ Tickets erstellen
- ✅ Eigene Tickets sehen und bearbeiten
- ✅ Eigene Tickets schließen
- ✅ Kommentare auf offenen Tickets hinzufügen
- ❌ Fremde Tickets sehen oder bearbeiten
- ❌ Tickets zuweisen oder Prioritäten ändern

#### Readonly
Nur Lesezugriff auf eigene Tickets.

**Permissions:**
- ✅ Eigene Tickets anzeigen
- ❌ Tickets erstellen, bearbeiten oder löschen
- ❌ Kommentare hinzufügen

### Permission-Enforcement

Permissions werden auf **zwei Ebenen** durchgesetzt:

1. **Backend (Server):** Alle API-Endpunkte prüfen Permissions (siehe [`src/server/api/tickets.js`](src/server/api/tickets.js))
2. **Frontend (UI):** UI-Elemente werden basierend auf Permissions ein-/ausgeblendet (siehe [`src/App.tsx`](src/App.tsx))

> ⚠️ **Wichtig:** Das Frontend-RBAC dient nur der UX-Optimierung. Die tatsächliche Sicherheit wird durch Backend-Validierung gewährleistet.

---

## 📡 API-Dokumentation

### Authentication

#### Login mit Google OAuth

```http
GET /api/auth/google
```

Leitet zur Google OAuth-Seite weiter.

#### Callback

```http
GET /api/auth/google/callback
```

Callback nach erfolgreicher Google-Authentifizierung.

#### Aktuellen Benutzer abrufen

```http
GET /api/auth/user
```

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "role": "user",
  "permissions": ["ticket:create", "ticket:view:own"]
}
```

#### Logout

```http
POST /api/auth/logout
```

### Tickets

#### Alle Tickets abrufen

```http
GET /api/tickets?page=1&limit=50&status=all&priority=all&search=
```

**Query-Parameter:**
- `page` (optional): Seitenzahl (Standard: 1)
- `limit` (optional): Tickets pro Seite (Standard: 50)
- `status` (optional): `all`, `open`, `in_progress`, `closed`
- `priority` (optional): `all`, `low`, `medium`, `high`
- `assignee` (optional): Filter nach Assignee
- `search` (optional): Volltextsuche

**Response:**
```json
{
  "data": [
    {
      "id": "T-1001",
      "title": "Login funktioniert nicht",
      "description": "Benutzer kann sich nicht einloggen",
      "status": "open",
      "priority": "high",
      "requester": "user@example.com",
      "assignee": "support@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T14:20:00.000Z",
      "comments": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3,
    "hasMore": true
  }
}
```

#### Ticket erstellen

```http
POST /api/tickets
```

**Request Body:**
```json
{
  "title": "Login funktioniert nicht",
  "description": "Detaillierte Beschreibung des Problems",
  "priority": "medium",
  "assignee": "support@example.com"
}
```

**Response:**
```json
{
  "id": "T-1002",
  "title": "Login funktioniert nicht",
  "description": "Detaillierte Beschreibung des Problems",
  "status": "open",
  "priority": "medium",
  "requester": "user@example.com",
  "assignee": "support@example.com",
  "createdBy": "user123",
  "createdAt": "2024-01-15T15:00:00.000Z",
  "updatedAt": "2024-01-15T15:00:00.000Z",
  "comments": []
}
```

#### Ticket aktualisieren

```http
PUT /api/tickets/:id
```

**Request Body (partial update):**
```json
{
  "status": "in_progress",
  "assignee": "support2@example.com",
  "priority": "high"
}
```

#### Kommentar hinzufügen

```http
PUT /api/tickets/:id
```

**Request Body:**
```json
{
  "comments": [
    {
      "id": "C_abc123_1705328400000",
      "author": "support@example.com",
      "text": "Wir arbeiten daran!",
      "createdAt": "2024-01-15T15:30:00.000Z"
    }
  ]
}
```

#### Ticket löschen

```http
DELETE /api/tickets/:id
```

**Erforderliche Permission:** `ticket:delete` (nur Admin)

### Agents

#### Agents abrufen

```http
GET /api/agents
```

**Response:**
```json
[
  "support@example.com",
  "support2@example.com",
  "admin@example.com"
]
```

---

## 📁 Projektstruktur

```
Ticketsystem_SPA/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── Login.tsx       # Login-Komponente
│   │   └── ProtectedRoute.tsx
│   ├── context/            # React Context
│   │   └── AuthContext.tsx # Authentifizierungs-Context
│   ├── rbac/               # Frontend RBAC
│   │   └── permissions.ts  # Permission-Definitionen
│   ├── utils/              # Utility-Funktionen
│   │   └── ticketHelpers.ts # Validierungsfunktionen
│   ├── server/             # Backend
│   │   ├── api/            # API-Routen
│   │   │   ├── tickets.js  # Ticket-Endpunkte
│   │   │   ├── agents.js   # Agent-Endpunkte
│   │   │   └── auth.js     # Auth-Endpunkte
│   │   ├── config/         # Konfiguration
│   │   │   └── passport.js # Passport-Config
│   │   ├── db/             # Datenbank
│   │   │   └── db.js       # MongoDB-Connection
│   │   ├── middleware/     # Express-Middleware
│   │   │   └── auth.js     # Auth-Middleware
│   │   ├── rbac/           # Backend RBAC
│   │   │   └── roles.js    # Rollen & Permissions
│   │   ├── models/         # Datenbank-Modelle
│   │   │   └── user.js
│   │   ├── app.js          # Express-App
│   │   ├── index.js        # Server-Entry-Point
│   │   └── seed.mjs        # Seed-Daten
│   ├── App.tsx             # Haupt-React-Komponente
│   └── main.tsx            # React-Entry-Point
├── tests/                  # Test-Dateien
├── public/                 # Statische Assets
├── dist/                   # Build-Ausgabe
├── .env                    # Umgebungsvariablen (nicht in Git)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧪 Tests

### Unit-Tests ausführen

```bash
# Alle Tests
npm run test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage-Report
npm run test:coverage
```

### Getestete Funktionen

- ✅ Ticket-Validierung (`istTitelGueltig`, `istBeschreibungGueltig`, `istKommentarGueltig`)
- ✅ RBAC-Permissions (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`)
- ✅ API-Endpunkte (mit Supertest)

---

## 🚀 Deployment

### Production-Build erstellen

```bash
npm run build
```

Der Build wird im `dist/` Ordner erstellt.

### Umgebungsvariablen setzen

Stellen Sie sicher, dass alle `.env`-Variablen in Ihrer Production-Umgebung gesetzt sind:

```env
MONGODB_URI=mongodb+srv://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
SESSION_SECRET=...
JWT_SECRET=...
VITE_API_URL=https://yourdomain.com
```

### Server starten

```bash
npm run start
```

### Empfohlene Hosting-Plattformen

- **Frontend:** Vercel, Netlify, Cloudflare Pages
- **Backend:** Railway, Render, Heroku
- **Datenbank:** MongoDB Atlas

---

## 🤝 Contributing

Contributions sind willkommen! Bitte beachten Sie:

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

### Coding-Standards

- TypeScript für alle neuen Dateien
- ESLint-Regeln befolgen
- Unit-Tests für neue Features schreiben
- Kommentare auf Deutsch oder Englisch

---

## 📝 License

Dieses Projekt ist unter der ISC-Lizenz lizenziert.

---

## 👤 Autor

Entwickelt mit ❤️ für moderne Support-Teams

---

## 🐛 Bug Reports & Feature Requests

Bitte erstellen Sie ein Issue im GitHub-Repository.

---

## 📚 Weitere Ressourcen

- [React Dokumentation](https://react.dev/)
- [Express.js Dokumentation](https://expressjs.com/)
- [MongoDB Dokumentation](https://www.mongodb.com/docs/)
- [Passport.js Dokumentation](http://www.passportjs.org/)
- [Vite Dokumentation](https://vitejs.dev/)

---

**Viel Erfolg mit dem Ticket System!** 🎫✨
