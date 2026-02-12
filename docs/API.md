# API Dokumentation - Ticketsystem

## Übersicht

**Basis-URL:** 
- Lokal: `http://localhost:5000`
- Produktion: `https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net`

**Authentifizierung:** 
- JWT-Token im `Authorization` Header
- Format: `Authorization: Bearer <token>`

**Content-Type:** `application/json`

---

## Authentifizierung

### Google OAuth Login starten

```http
GET /api/auth/google
```

**Beschreibung:** Startet Google OAuth 2.0 Flow

**Authentifizierung:** Keine

**Response:** Redirect zu Google Login

**Verwendung:**
```javascript
window.location.href = `${API_BASE}/api/auth/google`;
```

---

### Google OAuth Callback

```http
GET /api/auth/google/callback
```

**Beschreibung:** Callback nach erfolgreicher Google-Authentifizierung

**Authentifizierung:** Keine (von Google)

**Response:** Redirect zu Frontend mit Token in URL-Parameter

**Redirect:** `${FRONTEND_URL}/?token=<jwt_token>`

---

### Aktuelle User-Info abrufen

```http
GET /api/auth/me
```

**Beschreibung:** Gibt Informationen zum authentifizierten User zurück

**Authentifizierung:** ✅ Erforderlich

**Permissions:** Keine (nur authentifiziert)

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "Max Mustermann",
  "role": "user"
}
```

**Fehler:**
- `401 Unauthorized` - Kein oder ungültiger Token

---

### Logout

```http
POST /api/auth/logout
```

**Beschreibung:** Logout (Token wird clientseitig gelöscht)

**Authentifizierung:** Optional

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Hinweis:** JWT-Token müssen clientseitig aus `localStorage` entfernt werden

---

## Tickets

### Alle Tickets abrufen

```http
GET /api/tickets
```

**Beschreibung:** 
- Admins/Support sehen alle Tickets
- User sehen nur eigene Tickets (nach `createdBy` gefiltert)

**Authentifizierung:** ✅ Erforderlich

**Permissions:** 
- `ticket:view:all` - Alle Tickets sehen (Admin, Support)
- `ticket:view:own` - Eigene Tickets sehen (User, Readonly)

**Response:**
```json
[
  {
    "id": "T-1001",
    "title": "Login funktioniert nicht",
    "description": "Fehlermeldung beim Einloggen",
    "status": "open",
    "priority": "high",
    "requester": "user@example.com",
    "assignee": "admin@example.com",
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2026-02-08T10:30:00.000Z",
    "updatedAt": "2026-02-08T10:30:00.000Z",
    "comments": []
  }
]
```

**Sortierung:** Nach `updatedAt` absteigend (neueste zuerst)

---

### Neues Ticket erstellen

```http
POST /api/tickets
```

**Beschreibung:** Erstellt ein neues Ticket

**Authentifizierung:** ✅ Erforderlich

**Permissions:**
- `ticket:create` - Ticket erstellen (alle Rollen außer Readonly)
- `priority:edit` - Priorität setzen (Admin, Support)
- `ticket:assign` - Assignee setzen (Admin, Support)

**Request Body:**
```json
{
  "title": "Login funktioniert nicht",
  "description": "Fehlermeldung beim Einloggen",
  "priority": "high",         // Optional, nur mit priority:edit Permission
  "assignee": "admin@example.com"  // Optional, nur mit ticket:assign Permission
}
```

**Pflichtfelder:**
- `title` (String)
- `description` (String)

**Automatisch gesetzte Felder:**
- `id` - Sequentielle Nummer (T-1000, T-1001, ...)
- `status` - Immer "open" bei Erstellung
- `requester` - Email des authentifizierten Users
- `createdBy` - User-ID des Erstellers
- `createdAt` - Aktueller Timestamp
- `updatedAt` - Aktueller Timestamp
- `comments` - Leeres Array

**Response:**
```json
{
  "id": "T-1001",
  "title": "Login funktioniert nicht",
  "description": "Fehlermeldung beim Einloggen",
  "status": "open",
  "priority": "high",
  "requester": "user@example.com",
  "assignee": "admin@example.com",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2026-02-08T10:30:00.000Z",
  "updatedAt": "2026-02-08T10:30:00.000Z",
  "comments": []
}
```

**Fehler:**
- `400 Bad Request` - Fehlende Pflichtfelder
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Permission (Readonly User)

---

### Ticket aktualisieren

```http
PUT /api/tickets/:id
```

**Beschreibung:** Aktualisiert ein bestehendes Ticket

**Authentifizierung:** ✅ Erforderlich

**Permissions:**
- `ticket:edit:all` - Alle Tickets bearbeiten (Admin, Support)
- `ticket:edit:own` - Eigene Tickets bearbeiten (User)
- `priority:edit` - Priorität ändern (Admin, Support)
- `ticket:assign` - Assignee ändern (Admin, Support)
- `status:change:all` - Status aller Tickets ändern (Admin, Support)
- `status:change:own` - Status eigener Tickets ändern (User)
- `comment:add:closed` - Kommentare zu geschlossenen Tickets (Admin, Support)

**URL-Parameter:**
- `id` - Ticket-ID (z.B. "T-1001")

**Request Body:** (alle Felder optional)
```json
{
  "title": "Login Problem gelöst",
  "description": "Aktualisierte Beschreibung",
  "status": "closed",
  "priority": "low",
  "assignee": "support@example.com",
  "comments": [
    {
      "id": "C_abc123",
      "author": "user@example.com",
      "text": "Problem wurde behoben",
      "createdAt": "2026-02-08T11:00:00.000Z"
    }
  ]
}
```

**Permission-basierte Feldvalidierung:**
- Ohne `ticket:edit:all` oder `ticket:edit:own` → 403 Fehler
- `priority` ändern → Nur mit `priority:edit` Permission
- `assignee` ändern → Nur mit `ticket:assign` Permission
- `status` ändern → Mit `status:change:all` oder `status:change:own` (nur eigene)
- `comments` hinzufügen bei geschlossenem Ticket → Nur mit `comment:add:closed`

**Response:** Aktualisiertes Ticket-Objekt (gleiche Struktur wie POST)

**Fehler:**
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine Berechtigung für Ticket oder Feld
- `404 Not Found` - Ticket existiert nicht

---

### Ticket löschen

```http
DELETE /api/tickets/:id
```

**Beschreibung:** Löscht ein Ticket permanent

**Authentifizierung:** ✅ Erforderlich

**Permissions:** 
- `ticket:delete` - **Nur Admin**

**URL-Parameter:**
- `id` - Ticket-ID (z.B. "T-1001")

**Response:** Gelöschtes Ticket-Objekt
```json
{
  "id": "T-1001",
  "title": "Login funktioniert nicht",
  ...
}
```

**Fehler:**
- `401 Unauthorized` - Nicht authentifiziert
- `403 Forbidden` - Keine `ticket:delete` Permission
- `404 Not Found` - Ticket existiert nicht

---

## Agents (Zuweisbare User)

### Liste aller Agents abrufen

```http
GET /api/agents
```

**Beschreibung:** Gibt Email-Adressen aller User zurück, die Tickets zugewiesen werden können (Admin + Support)

**Authentifizierung:** ✅ Erforderlich

**Permissions:** Keine (authentifiziert reicht)

**Response:**
```json
[
  "admin@example.com",
  "support@example.com"
]
```

**Filter:** Nur User mit Rolle `admin` oder `support`

---

## Fehlercodes

| Code | Beschreibung | Ursache |
|------|--------------|---------|
| `400` | Bad Request | Fehlende oder ungültige Request-Daten |
| `401` | Unauthorized | Kein oder ungültiger JWT-Token |
| `403` | Forbidden | Fehlende Permission für Operation |
| `404` | Not Found | Ressource (Ticket) existiert nicht |
| `500` | Internal Server Error | Server-Fehler (DB-Verbindung, etc.) |

**Fehler-Format:**
```json
{
  "error": "Fehlerbeschreibung"
}
```

**Permission-Fehler mit Details:**
```json
{
  "error": "Insufficient permissions",
  "required": "ticket:delete"
}
```

---

## RBAC-Permissions

### Rollen-Übersicht

| Rolle | Beschreibung |
|-------|--------------|
| `admin` | Volle Rechte (alle Permissions) |
| `support` | Tickets verwalten, keine Löschung/User-Verwaltung |
| `user` | Nur eigene Tickets erstellen/bearbeiten |
| `readonly` | Nur eigene Tickets ansehen |

### Permission-Liste

#### Ticket Permissions
- `ticket:create` - Tickets erstellen
- `ticket:delete` - Tickets löschen (**nur Admin**)
- `ticket:view:all` - Alle Tickets sehen
- `ticket:view:own` - Eigene Tickets sehen
- `ticket:edit:own` - Eigene Tickets bearbeiten
- `ticket:edit:all` - Alle Tickets bearbeiten
- `ticket:close:own` - Eigene Tickets schließen
- `ticket:close:all` - Alle Tickets schließen

#### Assignment Permissions
- `ticket:assign` - Tickets zuweisen
- `ticket:reassign` - Tickets umverteilen

#### Priority & Status Permissions
- `priority:edit` - Priorität ändern
- `priority:view` - Priorität ansehen
- `status:change:all` - Status aller Tickets ändern
- `status:change:own` - Status eigener Tickets ändern

#### Comment Permissions
- `comment:add` - Kommentare hinzufügen
- `comment:add:closed` - Kommentare zu geschlossenen Tickets
- `comment:delete` - Kommentare löschen

#### Management Permissions
- `agents:view` - Agenten-Liste sehen
- `users:manage` - User verwalten (keine UI implementiert)

**Details:** Siehe [RBAC.md](./RBAC.md)

---

## Verwendungsbeispiele

### JavaScript/TypeScript

#### Ticket erstellen
```typescript
const token = localStorage.getItem('auth_token');

const response = await fetch(`${API_BASE}/api/tickets`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Neues Problem',
    description: 'Beschreibung des Problems',
  }),
});

const ticket = await response.json();
```

#### Ticket aktualisieren
```typescript
const response = await fetch(`${API_BASE}/api/tickets/T-1001`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'in-progress',
    comments: [
      ...existingComments,
      {
        id: 'C_' + Date.now(),
        author: user.email,
        text: 'Arbeite daran',
        createdAt: new Date().toISOString(),
      },
    ],
  }),
});

const updated = await response.json();
```

#### Alle Tickets laden
```typescript
const response = await fetch(`${API_BASE}/api/tickets`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const tickets = await response.json();
```

---

## Datenmodelle

### Ticket
```typescript
interface Ticket {
  id: string;                // "T-1001"
  title: string;             // "Login funktioniert nicht"
  description: string;       // "Fehlermeldung beim Einloggen"
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  requester: string;         // Email des Erstellers
  assignee?: string;         // Email des zugewiesenen Agents
  createdBy?: string;        // MongoDB User-ID
  createdAt: string;         // ISO-8601 Timestamp
  updatedAt: string;         // ISO-8601 Timestamp
  comments: Comment[];
}
```

### Comment
```typescript
interface Comment {
  id: string;                // "C_abc123"
  author: string;            // Email
  text: string;
  createdAt: string;         // ISO-8601 Timestamp
}
```

### User
```typescript
interface User {
  id: string;                // MongoDB _id
  email: string;
  name: string;
  role: 'admin' | 'support' | 'user' | 'readonly';
}
```

---

## Rate Limiting & Sicherheit

**Aktuell:** Keine Rate Limits implementiert

**Sicherheitsmaßnahmen:**
- JWT-Token mit 7 Tagen Gültigkeit
- HTTPS in Produktion (Azure)
- CORS konfiguriert
- MongoDB Injection-Schutz durch Mongoose
- Permission-Checks auf jedem geschützten Endpunkt

**Empfohlene Erweiterungen:**
- Rate Limiting mit `express-rate-limit`
- Request-Größenbeschränkung
- Token Blacklisting bei Logout
- Refresh Tokens

---

## Changelog

### Version 1.0.0 (Aktuell)
- ✅ Google OAuth 2.0 Authentifizierung
- ✅ JWT-basierte Sessions
- ✅ RBAC-System mit 4 Rollen
- ✅ Ticket CRUD mit Permission-Checks
- ✅ Sequentielle Ticket-IDs (T-1000, T-1001, ...)
- ✅ Comment-System
- ✅ Agent-Liste für Zuweisung

### Geplante Features
- 🔮 User-Verwaltung UI
- 🔮 Ticket-Attachments
- 🔮 Email-Benachrichtigungen
- 🔮 Ticket-Historie (Änderungslog)
- 🔮 SLA-Tracking
