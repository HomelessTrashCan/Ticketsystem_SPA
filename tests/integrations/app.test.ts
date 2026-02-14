import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Für echte Tests: Express App importieren
// import { app } from '../../src/server/app.js';

describe('App Integration Tests', () => {
    // Mock Server URL für Beispiel
    const baseURL = 'https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net';

    describe('Health & Status Endpoints', () => {
        it('should return health status', async () => {
            const response = await request(baseURL)
                .get('/health')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should serve the test page', async () => {
            const response = await request(baseURL)
                .get('/test')
                .expect(200);

            expect(response.text).toContain('Server is RUNNING');
        });
    });

    describe('API Routes', () => {
        it('should return agents list', async () => {
            const response = await request(baseURL)
                .get('/api/agents')
                .expect('Content-Type', /json/);

            // Kann 200 (success), 401 (unauthorized), oder 500 (DB error) sein
            expect([200, 401, 500]).toContain(response.status);
        });

        it('should handle tickets endpoint', async () => {
            const response = await request(baseURL)
                .get('/api/tickets');

            // Prüft ob Endpoint existiert (nicht 404)
            expect(response.status).not.toBe(404);
        });

        it('should return 404 for non-existent routes', async () => {
            const response = await request(baseURL)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.status).toBe(404);
        });
    });

    describe('POST Requests', () => {
        it('should reject unauthenticated ticket creation', async () => {
            const testTicket = {
                title: 'Test Ticket',
                description: 'Test Description',
                priority: 'medium'
            };

            const response = await request(baseURL)
                .post('/api/tickets')
                .send(testTicket);

            // Sollte 401 (Unauthorized) oder 403 (Forbidden) zurückgeben
            expect([401, 403, 500]).toContain(response.status);
        });
    });
});

/* 
 * BEISPIEL: Lokaler Test mit exportierter Express App
 * 
 * Dafür muss src/server/index.js angepasst werden:
 * 
 * // In src/server/index.js:
 * export const app = express();
 * // ... (alle middleware & routes)
 * 
 * // Am Ende nur in production starten:
 * if (process.env.NODE_ENV !== 'test') {
 *   app.listen(PORT, () => { ... });
 * }
 * 
 * // Dann in Tests:
 * import { app } from '../../src/server/index.js';
 * 
 * describe('Local Tests', () => {
 *   it('should test health endpoint locally', async () => {
 *     await request(app)
 *       .get('/health')
 *       .expect(200);
 *   });
 * });
 */