# Environment Variables - Production Setup Guide

Diese Datei beschreibt, welche Umgebungsvariablen für **Production Deployment** auf Azure benötigt werden.

> ⚠️ **Wichtig:** Diese Werte werden **NICHT** in einer `.env` Datei gespeichert, sondern direkt in Azure App Service Configuration!

## 📋 Production Environment Variables

### Azure App Service → Configuration → Application settings

| Variable | Beschreibung | Beispiel | Hinweise |
|----------|--------------|----------|----------|
| `MONGO_URI` | MongoDB Connection String | `mongodb+srv://produser:password@cluster.mongodb.net/?appName=TicketSystem` | ⚠️ Production-User verwenden! |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123456.apps.googleusercontent.com` | Aus Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxxxx` | Aus Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | OAuth Redirect URI | `https://ihre-app.azurewebsites.net/api/auth/google/callback` | ⚠️ **MUSS Production URL sein** |
| `SESSION_SECRET` | Session Encryption Key | `32-byte-hex-string` | Neu generieren! |
| `JWT_SECRET` | JWT Token Secret | `32-byte-hex-string` | Neu generieren! |
| `FRONTEND_URL` | Frontend URL | `https://ihre-app.azurewebsites.net` | ⚠️ **Production URL** |
| `NODE_ENV` | Environment | `production` | Wichtig für Sicherheit |
| `PORT` | Server Port | `8080` | Optional (Azure setzt oft automatisch) |

> ⚠️ **WICHTIG:** `VITE_API_URL` wird **NICHT** in Production gesetzt!  
> In Production verwendet die App automatisch relative URLs (`/api/tickets`),  
> da Frontend und Backend vom selben Server serviert werden.

---

## 🔐 Secrets generieren

Verwenden Sie **neue, sichere Secrets** für Production (nicht die aus lokaler `.env`):

```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Führen Sie zweimal aus für `SESSION_SECRET` und `JWT_SECRET`.

---

## 🔄 Unterschiede: Lokal vs. Production

| Variable | Local (`.env`) | Production (Azure) |
|----------|----------------|---------------------|
| `GOOGLE_CALLBACK_URL` | `http://localhost:8080/api/auth/google/callback` | `https://ihre-app.azurewebsites.net/api/auth/google/callback` |
| `FRONTEND_URL` | `http://localhost:5174` | `https://ihre-app.azurewebsites.net` |
| `NODE_ENV` | `development` | `production` |
| `MONGO_URI` | Dev-Datenbank | Production-Datenbank |
| `SESSION_SECRET` | Dev-Secret | Production-Secret (neu generiert) |
| `JWT_SECRET` | Dev-Secret | Production-Secret (neu generiert) |
| `VITE_API_URL` | `http://localhost:8080` | ❌ **NICHT setzen** (verwendet relative URLs) |

---

## ✅ Setup-Checkliste

### 1. MongoDB Production Setup
- [ ] Separaten Production-User in MongoDB Atlas erstellen
- [ ] Starkes Passwort verwenden
- [ ] Nur Azure IP-Adressen whitelisten (nicht 0.0.0.0/0)
- [ ] Connection String in Azure setzen

### 2. Google OAuth Production Setup
- [ ] Google Cloud Console → Credentials → OAuth Client bearbeiten
- [ ] Production Callback URL hinzufügen: `https://ihre-app.azurewebsites.net/api/auth/google/callback`
- [ ] **Beide URLs** (localhost + production) müssen eingetragen sein
- [ ] Client ID & Secret in Azure setzen

### 3. Azure App Service
- [ ] Alle Umgebungsvariablen setzen (siehe Tabelle oben)
- [ ] Neue, sichere Secrets für SESSION_SECRET und JWT_SECRET generieren
- [ ] NODE_ENV auf `production` setzen
- [ ] App neu starten

### 4. Testen
- [ ] OAuth Login funktioniert
- [ ] Redirect nach Login funktioniert
- [ ] API-Endpoints funktionieren
- [ ] Datenbank-Verbindung funktioniert

---

## 🔍 Debugging in Production

### Umgebungsvariablen überprüfen

Azure Portal → Ihre Web App → **Advanced Tools (Kudu)** → **Environment**

Oder via Azure CLI:
```bash
az webapp config appsettings list --name ihre-app --resource-group ihre-gruppe
```

### Logs anzeigen

Azure Portal → Ihre Web App → **Log stream**

---

## 🚨 Sicherheits-Best Practices

1. ✅ **Niemals** Production-Secrets in Git committen
2. ✅ Separate Datenbanken für Dev/Production
3. ✅ Starke, unique Secrets für Production
4. ✅ IP-Whitelisting in MongoDB für Production
5. ✅ `NODE_ENV=production` setzen (aktiviert Security-Features)
6. ✅ HTTPS erzwingen in Azure App Service
7. ✅ Secrets regelmäßig rotieren

---

## 📖 Weitere Informationen

- [Azure App Service Dokumentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)
- [Google OAuth Best Practices](https://developers.google.com/identity/protocols/oauth2/web-server#security-considerations)
