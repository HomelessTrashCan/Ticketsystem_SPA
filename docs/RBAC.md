# Role-Based Access Control (RBAC) System

## Übersicht

Das Ticket-System verwendet ein **Permission-basiertes RBAC-System** (Role-Based Access Control), das die Zugriffskontrolle flexibel und erweiterbar macht.

## Architektur

### 🎭 Rollen

Das System definiert 4 Rollen:

| Rolle | Beschreibung | Zugriff |
|-------|--------------|---------|
| **admin** | System-Administrator | Voller Zugriff auf alle Funktionen |
| **support** | Support-Agent | Kann alle Tickets verwalten, aber keine User löschen |
| **user** | Normaler Benutzer | Kann nur eigene Tickets erstellen und verwalten |
| **readonly** | Nur-Lese-Zugriff | Kann nur eigene Tickets ansehen |

### 🔐 Permissions

Statt hardcodierte `if (role === 'admin')` Checks verwenden wir granulare Permissions:

#### Ticket Permissions
- `ticket:create` - Tickets erstellen
- `ticket:delete` - Tickets löschen
- `ticket:view:all` - Alle Tickets sehen
- `ticket:view:own` - Eigene Tickets sehen
- `ticket:edit:own` - Eigene Tickets bearbeiten
- `ticket:edit:all` - Alle Tickets bearbeiten
- `ticket:close:own` - Eigene Tickets schließen
- `ticket:close:all` - Alle Tickets schließen

#### Assignment Permissions
- `ticket:assign` - Tickets zuweisen
- `ticket:reassign` - Tickets neu zuweisen

#### Priority & Status Permissions
- `priority:edit` - Priorität ändern
- `priority:view` - Priorität ansehen
- `status:change:all` - Status aller Tickets ändern
- `status:change:own` - Status eigener Tickets ändern

#### Comment Permissions
- `comment:add` - Kommentare hinzufügen
- `comment:add:closed` - Kommentare zu geschlossenen Tickets hinzufügen
- `comment:delete` - Kommentare löschen

#### Management Permissions
- `agents:view` - Agenten-Liste sehen
- `users:manage` - User verwalten

## Implementierung

### Backend

**Datei:** `src/server/rbac/roles.js`
```javascript
import { PERMISSIONS, hasPermission } from '../rbac/roles.js';

// Permission Check
if (hasPermission(req.user, PERMISSIONS.TICKET_DELETE)) {
  // User darf Ticket löschen
}

// Route Protection
router.delete('/:id', requirePermission(PERMISSIONS.TICKET_DELETE), handler);
```

**Middleware:** `src/server/middleware/auth.js`
- `requirePermission(permission)` - Single Permission required
- `requireAnyPermission([...])` - Mindestens eine Permission required
- `requireAllPermissions([...])` - Alle Permissions required

### Frontend

**Datei:** `src/rbac/permissions.ts`
```typescript
import { PERMISSIONS } from '../rbac/permissions';

// In Komponenten
const { hasPermission } = useAuth();

if (hasPermission(PERMISSIONS.TICKET_DELETE)) {
  // Zeige "Löschen" Button
}
```

## Neue Rolle hinzufügen

### 1. Backend: `src/server/rbac/roles.js`
```javascript
export const ROLES = {
  // ... bestehende Rollen
  TEAM_LEAD: 'team_lead',
};

export const ROLE_PERMISSIONS = {
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW_ALL,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.PRIORITY_EDIT,
    // ... weitere Permissions
  ],
};
```

### 2. Frontend: `src/rbac/permissions.ts`
```typescript
export const ROLES = {
  // ... bestehende Rollen
  TEAM_LEAD: 'team_lead',
} as const;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW_ALL,
    // ... (gleiche wie Backend)
  ],
};
```

### 3. TypeScript Types aktualisieren
**Datei:** `src/context/AuthContext.tsx`
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'support' | 'readonly' | 'team_lead'; // ← Neue Rolle
}
```

### 4. MongoDB: Rolle setzen
In MongoDB Atlas → TicketSystem → users Collection:
```json
{
  "_id": "...",
  "email": "user@example.com",
  "role": "team_lead"
}
```

## Neue Permission hinzufügen

### 1. Backend: `src/server/rbac/roles.js`
```javascript
export const PERMISSIONS = {
  // ... bestehende permissions
  TICKET_EXPORT: 'ticket:export',
};

// Zu Rollen hinzufügen
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // ...
    PERMISSIONS.TICKET_EXPORT,
  ],
};
```

### 2. Frontend: `src/rbac/permissions.ts`
```typescript
export const PERMISSIONS = {
  // ... bestehende permissions
  TICKET_EXPORT: 'ticket:export',
} as const;

// Zu Rollen hinzufügen (gleich wie Backend)
```

### 3. In Code verwenden
**Backend:**
```javascript
router.get('/export', requirePermission(PERMISSIONS.TICKET_EXPORT), handler);
```

**Frontend:**
```typescript
{hasPermission(PERMISSIONS.TICKET_EXPORT) && (
  <button onClick={exportTickets}>Exportieren</button>
)}
```

## Vorteile des Systems

✅ **Erweiterbar:** Neue Rollen/Permissions einfach hinzufügen  
✅ **Zentral:** Permissions an einer Stelle definiert (Backend + Frontend)  
✅ **Typsicher:** TypeScript verhindert Fehler (Frontend)  
✅ **Sicher:** Backend validiert IMMER (Frontend nur für UX)  
✅ **Lesbar:** `hasPermission(PERMISSIONS.TICKET_DELETE)` statt `role === 'admin'`  
✅ **Wartbar:** Änderungen an Permissions ohne Code-Änderungen überall  

## Sicherheits-Best Practices

1. **Backend ist die Wahrheit:** Frontend-Checks sind nur für UX, Backend MUSS IMMER validieren
2. **JWT enthält Rolle:** Token wird bei jedem Request geprüft
3. **Permissions in DB:** Rollen können in MongoDB gesetzt werden ohne Code-Deploy
4. **Fail-Safe:** Kein Permission = kein Zugriff (Default-Deny)

## Testing

### Rolle in MongoDB setzen (manuell)
```bash
# MongoDB Atlas → Browse Collections → TicketSystem → users
# Edit Document → Feld "role" auf gewünschte Rolle setzen
```

### Lokal testen
```javascript
// In src/server/models/user.js temporär ändern:
role: 'support' // Statt 'user' für neue User
```

## Troubleshooting

**Problem:** User hat keine Permissions  
**Lösung:** Prüfe `role` Feld in MongoDB users Collection

**Problem:** Frontend zeigt Buttons, aber Backend gibt 403  
**Lösung:** Frontend-Permissions in `src/rbac/permissions.ts` müssen mit Backend übereinstimmen

**Problem:** Neue Rolle funktioniert nicht  
**Lösung:** Prüfe ob Rolle in ALLEN Files hinzugefügt wurde (Backend, Frontend, TypeScript Types)
## User-Verwaltung

### 🚧 Aktueller Status

Die Permission `users:manage` ist im RBAC-System **definiert**, aber es gibt **keine Admin-UI** dafür.

**Was funktioniert:**
- ✅ Permission-Check im Backend (`USERS_MANAGE`)
- ✅ Nur Admins haben die Permission
- ✅ kann in Custom API Routes verwendet werden

**Was NICHT existiert:**
- ❌ Keine Admin-Oberfläche zum User anzeigen
- ❌ Keine UI zum Rollen ändern
- ❌ Keine User sperren/löschen Funktion

### 📝 User-Rollen manuell ändern

**Anleitung für MongoDB Atlas:**

1. **MongoDB Atlas öffnen** → Dein Cluster auswählen
2. **Browse Collections** → Datenbank `TicketSystem` → Collection `users`
3. **User finden:** Nach `email` suchen
4. **Edit Document:** Klick auf den Edit-Button (Stift-Icon)
5. **Rolle ändern:** 
   ```json
   "role": "user"  →  "role": "admin"
   ```
6. **Update:** Speichern
7. **User muss sich neu einloggen** (neuer JWT Token wird mit neuer Rolle generiert)

**Verfügbare Rollen:**
- `admin` - Volle Rechte (Tickets löschen, alle sehen/bearbeiten, User verwalten)
- `support` - Tickets verwalten (alle sehen/bearbeiten/zuweisen, kein Löschen)
- `user` - Nur eigene Tickets (erstellen/bearbeiten, keine fremden sehen)
- `readonly` - Nur lesen (eigene Tickets ansehen)

**⚠️ Wichtig:** Nach Rollenänderung muss der User sich **ausloggen und neu einloggen**, damit der neue JWT Token mit der aktualisierten Rolle generiert wird.

### 🔮 Zukünftige Erweiterung

Um eine User-Verwaltungs-UI zu implementieren, folgende Komponenten benötigt:

**Backend:**
```javascript
// src/server/api/users.js
router.get('/', requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.put('/:id/role', requirePermission(PERMISSIONS.USERS_MANAGE), async (req, res) => {
  // Update user role in database
});
```

**Frontend:**
- Admin-Tab "Users" (nur für Admins sichtbar)
- User-Liste mit Email, Name, Rolle, Registrierungsdatum
- Rolle ändern Dropdown
- Optional: User aktivieren/deaktivieren