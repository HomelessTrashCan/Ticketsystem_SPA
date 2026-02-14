# Supertest Guide

## Was ist Supertest?

Supertest ist eine Library für HTTP-Integration-Tests. Sie ermöglicht es, HTTP-Requests gegen deine Express-App zu testen, ohne den Server tatsächlich starten zu müssen.

## Installation

```powershell
npm install -D supertest @types/supertest
```

## Basis-Verwendung

### 1. Remote Server testen (aktuell)

```typescript
import request from 'supertest';

describe('API Tests', () => {
    const baseURL = 'https://your-app.azurewebsites.net';

    it('should get health status', async () => {
        const response = await request(baseURL)
            .get('/health')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(response.body.status).toBe('ok');
    });
});
```

### 2. Lokale Express App testen (empfohlen)

**Schritt 1: Express App exportieren**

Erstelle eine separate `app.js` Datei:

```javascript
// src/server/app.js
import express from 'express';
import cors from 'cors';
// ... andere imports

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// ... weitere middleware

// Routes
app.use('/api/tickets', ticketsRouter);
app.use('/api/agents', agentsRouter);
// ... weitere routes

// KEIN app.listen() hier!
```

**Schritt 2: Server-Datei anpassen**

```javascript
// src/server/index.js
import { app } from './app.js';

const PORT = process.env.PORT || 8080;

// Nur in production/dev starten, nicht im Test
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
```

**Schritt 3: Tests schreiben**

```typescript
// tests/integrations/api.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';

describe('API Integration Tests', () => {
    it('should test local app', async () => {
        await request(app)
            .get('/health')
            .expect(200);
    });
});
```

## Supertest Methoden

### HTTP-Verben

```typescript
// GET Request
await request(app).get('/api/users');

// POST Request
await request(app)
    .post('/api/users')
    .send({ name: 'John', email: 'john@example.com' });

// PUT Request
await request(app)
    .put('/api/users/123')
    .send({ name: 'Jane' });

// DELETE Request
await request(app).delete('/api/users/123');

// PATCH Request
await request(app)
    .patch('/api/users/123')
    .send({ email: 'new@example.com' });
```

### Headers setzen

```typescript
await request(app)
    .get('/api/protected')
    .set('Authorization', 'Bearer token123')
    .set('Content-Type', 'application/json');
```

### Query Parameters

```typescript
await request(app)
    .get('/api/search')
    .query({ q: 'test', limit: 10 });
// Ergibt: /api/search?q=test&limit=10
```

### Expectations (Assertions)

```typescript
await request(app)
    .get('/api/users')
    .expect(200)                           // Status Code
    .expect('Content-Type', /json/)        // Header (Regex)
    .expect('Content-Length', '123')       // Exakte Header-Wert
    .expect({ success: true });           // Body Match
```

### Response-Daten prüfen

```typescript
const response = await request(app)
    .get('/api/users')
    .expect(200);

// Mit Vitest/Jest assertions
expect(response.body).toHaveLength(5);
expect(response.body[0]).toHaveProperty('name');
expect(response.status).toBe(200);
expect(response.headers['content-type']).toMatch(/json/);
```

## Erweiterte Beispiele

### Authenticated Requests

```typescript
describe('Protected Routes', () => {
    let authToken: string;

    beforeAll(async () => {
        // Login und Token holen
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: 'test', password: 'test123' });
        
        authToken = loginResponse.body.token;
    });

    it('should access protected route', async () => {
        await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
    });
});
```

### File Uploads

```typescript
await request(app)
    .post('/api/upload')
    .attach('file', 'path/to/file.pdf')
    .field('description', 'Test upload')
    .expect(201);
```

### Cookie Handling

```typescript
const agent = request.agent(app); // Erhält Cookies

// Login
await agent
    .post('/api/login')
    .send({ username: 'test', password: 'test123' })
    .expect(200);

// Folgende Requests verwenden automatisch die Cookies
await agent
    .get('/api/profile')
    .expect(200);
```

### Error Handling

```typescript
it('should handle validation errors', async () => {
    const response = await request(app)
        .post('/api/users')
        .send({ email: 'invalid' }) // Fehlt 'name'
        .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('validation');
});

it('should return 404 for non-existent route', async () => {
    await request(app)
        .get('/api/nonexistent')
        .expect(404);
});
```

### Parallel Tests

```typescript
describe('Parallel Requests', () => {
    it('should handle multiple requests', async () => {
        const requests = [
            request(app).get('/api/users'),
            request(app).get('/api/tickets'),
            request(app).get('/api/agents')
        ];

        const responses = await Promise.all(requests);

        responses.forEach(response => {
            expect(response.status).toBe(200);
        });
    });
});
```

## Vollständiges Beispiel

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';
import { connectDB } from '../../src/server/db.js';

describe('Ticket API Integration Tests', () => {
    let db: any;

    beforeAll(async () => {
        // Test-Datenbank verbinden
        db = await connectDB();
        // Test-Daten einfügen
        await db.collection('tickets').insertOne({
            id: 'TEST-001',
            title: 'Test Ticket',
            status: 'open'
        });
    });

    afterAll(async () => {
        // Cleanup
        await db.collection('tickets').deleteMany({ id: /^TEST-/ });
    });

    describe('GET /api/tickets', () => {
        it('should return all tickets', async () => {
            const response = await request(app)
                .get('/api/tickets')
                .expect(200)
                .expect('Content-Type', /json/);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should filter tickets by status', async () => {
            const response = await request(app)
                .get('/api/tickets')
                .query({ status: 'open' })
                .expect(200);

            response.body.forEach((ticket: any) => {
                expect(ticket.status).toBe('open');
            });
        });
    });

    describe('POST /api/tickets', () => {
        it('should create a new ticket', async () => {
            const newTicket = {
                title: 'New Test Ticket',
                description: 'Test Description',
                priority: 'high'
            };

            const response = await request(app)
                .post('/api/tickets')
                .send(newTicket)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(newTicket.title);
        });

        it('should validate required fields', async () => {
            const invalidTicket = {
                description: 'Missing title'
            };

            const response = await request(app)
                .post('/api/tickets')
                .send(invalidTicket)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/tickets/:id', () => {
        it('should return a specific ticket', async () => {
            const response = await request(app)
                .get('/api/tickets/TEST-001')
                .expect(200);

            expect(response.body.id).toBe('TEST-001');
            expect(response.body.title).toBe('Test Ticket');
        });

        it('should return 404 for non-existent ticket', async () => {
            await request(app)
                .get('/api/tickets/NONEXISTENT')
                .expect(404);
        });
    });
});
```

## Testing Best Practices

### 1. Isolierte Tests

```typescript
// ✅ Gut: Jeder Test ist unabhängig
it('should create ticket', async () => {
    const ticket = await createTestTicket();
    // ... test
    await deleteTestTicket(ticket.id);
});

// ❌ Schlecht: Tests hängen voneinander ab
it('should create ticket', async () => {
    globalTicketId = await createTicket();
});
it('should update ticket', async () => {
    await updateTicket(globalTicketId); // Abhängig vom vorherigen Test
});
```

### 2. Setup & Cleanup

```typescript
describe('API Tests', () => {
    beforeEach(async () => {
        // Vor jedem Test: Frische Test-Daten
        await seedTestData();
    });

    afterEach(async () => {
        // Nach jedem Test: Cleanup
        await cleanupTestData();
    });
});
```

### 3. Environment Variables

```typescript
// .env.test
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/test-db
PORT=3001

// In Tests
import 'dotenv/config';

describe('Tests', () => {
    expect(process.env.NODE_ENV).toBe('test');
});
```

### 4. Timeouts für langsame Tests

```typescript
it('should handle slow operation', async () => {
    await request(app)
        .post('/api/process')
        .timeout(10000) // 10 Sekunden
        .expect(200);
}, 15000); // Vitest timeout: 15 Sekunden
```

## Debugging

```typescript
// Response ausgeben
const response = await request(app).get('/api/users');
console.log('Status:', response.status);
console.log('Body:', response.body);
console.log('Headers:', response.headers);

// Mit .expect() chain für debugging
await request(app)
    .get('/api/users')
    .expect(200)
    .expect((res) => {
        console.log('Response:', res.body);
    });
```

## Weitere Ressourcen

- [Supertest GitHub](https://github.com/ladjs/supertest)
- [Vitest Dokumentation](https://vitest.dev/)
- [Express Testing](https://expressjs.com/en/guide/testing.html)
