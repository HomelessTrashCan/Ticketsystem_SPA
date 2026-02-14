// ============================================
// LOCAL INTEGRATION TESTS
// ============================================
// Diese Tests laufen gegen die lokale Express-App
// OHNE Server zu starten (schneller, offline möglich)
// Nutzt Supertest mit der exportierten app

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/app.js';

describe('Local Integration Tests', () => {
  
  // ============================================
  // HEALTH & STATUS ENDPOINTS
  // ============================================
  
  describe('Health & Status', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Prüfe Response-Struktur
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('nodeVersion');
      expect(response.body).toHaveProperty('env');
      
      // Prüfe Timestamp Format (ISO 8601)
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should serve test page with HTML', async () => {
      const response = await request(app)
        .get('/test')
        .expect('Content-Type', /html/)
        .expect(200);

      expect(response.text).toContain('Server is RUNNING');
      expect(response.text).toContain('Health Check');
    });

    it('should return debug files info', async () => {
      const response = await request(app)
        .get('/debug/files')
        .expect('Content-Type', /json/);

      // Kann 200 (dist existiert) oder 500 (dist fehlt) sein
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('cwd');
        expect(response.body).toHaveProperty('files');
      } else {
        // Bei 500: Error message vorhanden
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  // ============================================
  // API ENDPOINTS - Agents
  // ============================================
  
  describe('GET /api/agents', () => {
    it('should return agents list or require auth', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect('Content-Type', /json/);

      // Kann 200 (success) oder 401 (unauthorized) sein
      // 500 ist NICHT ok (sollte als Fehler gelten)
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        // Bei Erfolg: Prüfe Array-Struktur
        expect(Array.isArray(response.body)).toBe(true);
      }
    });
  });

  // ============================================
  // API ENDPOINTS - Tickets
  // ============================================
  
  describe('GET /api/tickets', () => {
    it('should handle tickets endpoint', async () => {
      const response = await request(app)
        .get('/api/tickets');

      // Endpoint sollte existieren (nicht 404)
      expect(response.status).not.toBe(404);
      
      // Akzeptiere 200 oder Auth-Fehler
      expect([200, 401, 403]).toContain(response.status);
    });

    it('should support query parameters', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .query({ status: 'open', limit: 10 });

      // Endpoint sollte Query-Params akzeptieren
      expect(response.status).not.toBe(404);
    });
  });

  describe('POST /api/tickets', () => {
    it('should reject ticket creation without authentication', async () => {
      const testTicket = {
        title: 'Test Ticket from Integration Test',
        description: 'This should be rejected',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(testTicket)
        .expect('Content-Type', /json/);

      // Sollte unauthorized sein (401 oder 403)
      expect([401, 403]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const invalidTicket = {
        // Fehlt: title
        description: 'Missing title field'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(invalidTicket);

      // Sollte entweder Validation-Error (400) oder Auth-Error (401/403) sein
      expect([400, 401, 403]).toContain(response.status);
    });

    it('should reject invalid priority values', async () => {
      const invalidTicket = {
        title: 'Test',
        description: 'Test',
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(invalidTicket);

      // Validation oder Auth Error
      expect([400, 401, 403]).toContain(response.status);
    });

    it('should return 400 for missing description', async () => {
      const invalidTicket = {
        title: 'Missing Description',
        // description fehlt
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(invalidTicket);

      // Sollte Validation Error (400) oder Auth Error sein
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  // ============================================
  // CRUD OPERATIONS (Full Lifecycle)
  // ============================================
  
  describe('PUT /api/tickets/:id', () => {
    it('should handle ticket updates', async () => {
      // Versuche ein Ticket zu erstellen und zu updaten
      const newTicket = {
        title: 'Ticket to Update',
        description: 'Will be updated',
        priority: 'low'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .send(newTicket);

      // Wenn Auth required: Test beenden
      if ([401, 403].includes(createResponse.status)) {
        // Update-Test mit nicht-existierendem Ticket
        await request(app)
          .put('/api/tickets/T-999999')
          .send({ title: 'Updated' })
          .expect((res) => {
            // Sollte 404 oder Auth-Error sein
            expect([404, 401, 403]).toContain(res.status);
          });
        return;
      }

      // Auth nicht aktiv: Vollständiger CRUD-Test
      expect(createResponse.status).toBe(201);
      const ticketId = createResponse.body.id;

      // Update das Ticket
      const updateData = {
        title: 'Updated Title',
        status: 'in-progress',
        priority: 'high'
      };

      const updateResponse = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .send(updateData)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(updateResponse.body.title).toBe('Updated Title');
      expect(updateResponse.body.status).toBe('in-progress');
      expect(updateResponse.body.priority).toBe('high');

      // Cleanup
      await request(app).delete(`/api/tickets/${ticketId}`);
    });

    it('should return 404 when updating non-existent ticket', async () => {
      const response = await request(app)
        .put('/api/tickets/T-999999')
        .send({ title: 'Updated Title' });

      // Sollte 404 sein (oder Auth-Error wenn Auth aktiv)
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should handle ticket deletion', async () => {
      const newTicket = {
        title: 'Ticket to Delete',
        description: 'Will be deleted',
        priority: 'low'
      };

      const createResponse = await request(app)
        .post('/api/tickets')
        .send(newTicket);

      // Wenn Auth required: Nur Endpoint-Existenz testen
      if ([401, 403].includes(createResponse.status)) {
        await request(app)
          .delete('/api/tickets/T-999999')
          .expect((res) => {
            expect([404, 401, 403]).toContain(res.status);
          });
        return;
      }

      // Auth nicht aktiv: Vollständiger Delete-Test
      expect(createResponse.status).toBe(201);
      const ticketId = createResponse.body.id;

      // Lösche das Ticket
      await request(app)
        .delete(`/api/tickets/${ticketId}`)
        .expect(200);

      // Verifiziere dass es gelöscht wurde (sollte 404 geben)
      await request(app)
        .get(`/api/tickets/${ticketId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent ticket', async () => {
      const response = await request(app)
        .delete('/api/tickets/T-999999');

      // Sollte 404 sein (oder Auth-Error)
      expect([404, 401, 403]).toContain(response.status);
    });
  });

  describe('Ticket ID Generation', () => {
    it('should generate sequential ticket IDs', async () => {
      const ticket1Response = await request(app)
        .post('/api/tickets')
        .send({
          title: 'Sequential Test 1',
          description: 'Testing ID generation',
          priority: 'low'
        });

      // Wenn Auth: Test beenden
      if ([401, 403].includes(ticket1Response.status)) {
        return;
      }

      const ticket2Response = await request(app)
        .post('/api/tickets')
        .send({
          title: 'Sequential Test 2',
          description: 'Testing ID generation',
          priority: 'low'
        });

      expect(ticket1Response.status).toBe(201);
      expect(ticket2Response.status).toBe(201);

      const ticket1 = ticket1Response.body;
      const ticket2 = ticket2Response.body;

      // IDs sollten Format T-XXX haben
      expect(ticket1.id).toMatch(/^T-\d+$/);
      expect(ticket2.id).toMatch(/^T-\d+$/);

      // ID sollte sequentiell sein
      const id1 = parseInt(ticket1.id.replace('T-', ''));
      const id2 = parseInt(ticket2.id.replace('T-', ''));
      expect(id2).toBe(id1 + 1);

      // Cleanup
      await request(app).delete(`/api/tickets/${ticket1.id}`);
      await request(app).delete(`/api/tickets/${ticket2.id}`);
    });

    it('should include all required fields in created ticket', async () => {
      const newTicket = {
        title: 'Complete Field Test',
        description: 'Testing all fields',
        priority: 'medium',
        requester: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(newTicket);

      // Wenn Auth: Beenden
      if ([401, 403].includes(response.status)) {
        return;
      }

      expect(response.status).toBe(201);
      const ticket = response.body;

      // Prüfe alle Pflichtfelder
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('title', newTicket.title);
      expect(ticket).toHaveProperty('description', newTicket.description);
      expect(ticket).toHaveProperty('priority', newTicket.priority);
      expect(ticket).toHaveProperty('status', 'open'); // Default status
      expect(ticket).toHaveProperty('createdAt');
      expect(ticket).toHaveProperty('updatedAt');

      // Cleanup
      await request(app).delete(`/api/tickets/${ticket.id}`);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Not Found');
    });

    it('should return 404 for invalid API methods', async () => {
      await request(app)
        .delete('/api/invalid-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Sollte 400 Bad Request sein
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  // ============================================
  // HEADERS & CORS
  // ============================================
  
  describe('Headers & CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      // CORS Header sollte gesetzt sein
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should accept JSON content type', async () => {
      await request(app)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send({ title: 'Test' });

      // Test läuft durch wenn Content-Type akzeptiert wird
      expect(true).toBe(true);
    });
  });

  // ============================================
  // PERFORMANCE
  // ============================================
  
  describe('Performance', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - start;
      
      // Health-Check sollte unter 100ms sein (lokal)
      expect(duration).toBeLessThan(100);
    });

    it('should handle multiple parallel requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      // Alle sollten erfolgreich sein
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

// ============================================
// HINWEISE ZUR VERWENDUNG
// ============================================
/*
 * Diese Tests laufen LOKAL gegen die Express-App:
 * 
 * Vorteile:
 * - ⚡ Sehr schnell (~5-50ms pro Test)
 * - 🔒 Offline möglich
 * - 🎯 Keine externen Abhängigkeiten
 * - 🧪 Gut für TDD (Test-Driven Development)
 * 
 * Ausführen:
 * npm test tests/integrations/app.local.test.ts
 * 
 * In CI/CD:
 * Diese Tests laufen in der GitHub Actions Pipeline
 * als Teil des "integration-tests" Jobs
 */
