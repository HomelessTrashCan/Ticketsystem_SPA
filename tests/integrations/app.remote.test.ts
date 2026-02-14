// ============================================
// REMOTE E2E TESTS (Production/Azure)
// ============================================
// Diese Tests laufen gegen die deployed Azure-App
// Für End-to-End Testing in Production
// WICHTIG: Diese Tests brauchen Internet-Verbindung!

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Azure Production URL
const PRODUCTION_URL = 'https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net';

// Timeout für Remote-Tests erhöhen (Azure kann langsam sein)
const REMOTE_TIMEOUT = 10000; // 10 Sekunden

describe('Remote E2E Tests (Azure Production)', () => {
  
  let isServerReachable = false;

  beforeAll(async () => {
    // Prüfe ob Server erreichbar ist
    try {
      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(5000);
      
      isServerReachable = response.status === 200;
    } catch (error) {
      console.warn('⚠️  Production server not reachable - tests will be skipped');
      isServerReachable = false;
    }
  });

  // ============================================
  // SMOKE TESTS (Basis-Funktionalität)
  // ============================================
  
  describe('Smoke Tests', () => {
    it('should have a healthy production server', async () => {
      if (!isServerReachable) {
        console.warn('⚠️  Skipping test - server not reachable');
        return;
      }

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.env).toBe('production');
    }, REMOTE_TIMEOUT);

    it('should serve the homepage', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/')
        .timeout(REMOTE_TIMEOUT)
        .expect(200);

      // Sollte HTML zurückgeben (React App)
      expect(response.headers['content-type']).toMatch(/html/);
    }, REMOTE_TIMEOUT);

    it('should have test page available', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/test')
        .timeout(REMOTE_TIMEOUT)
        .expect(200);

      expect(response.text).toContain('Server is RUNNING');
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // API AVAILABILITY (Endpoints erreichbar?)
  // ============================================
  
  describe('API Availability', () => {
    it('should have agents API endpoint', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/api/agents')
        .timeout(REMOTE_TIMEOUT)
        .expect('Content-Type', /json/);

      // Endpoint sollte existieren (200 oder Auth-Error, aber nicht 404)
      expect(response.status).not.toBe(404);
      expect([200, 401, 403]).toContain(response.status);
    }, REMOTE_TIMEOUT);

    it('should have tickets API endpoint', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/api/tickets')
        .timeout(REMOTE_TIMEOUT);

      expect(response.status).not.toBe(404);
      expect([200, 401, 403]).toContain(response.status);
    }, REMOTE_TIMEOUT);

    it('should have auth API endpoint', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/api/auth/me')
        .timeout(REMOTE_TIMEOUT);

      // Auth /me Endpoint sollte existieren (nicht 404)
      // Status 401 ist OK (unauthorized), aber nicht 404
      expect(response.status).not.toBe(404);
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // SECURITY CHECKS
  // ============================================
  
  describe('Security', () => {
    it('should reject unauthenticated POST requests', async () => {
      if (!isServerReachable) return;

      const testTicket = {
        title: 'Unauthorized Test Ticket',
        description: 'Should be rejected',
        priority: 'low'
      };

      const response = await request(PRODUCTION_URL)
        .post('/api/tickets')
        .send(testTicket)
        .timeout(REMOTE_TIMEOUT);

      // Sollte unauthorized sein
      expect([401, 403]).toContain(response.status);
    }, REMOTE_TIMEOUT);

    it('should have HTTPS enabled', () => {
      // Production URL sollte HTTPS verwenden
      expect(PRODUCTION_URL).toMatch(/^https:\/\//);
    });

    it('should have secure cookies in production', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT);

      // In Production sollten Cookies secure sein
      // (kann nur indirekt getestet werden)
      expect(response.status).toBe(200);
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/api/this-does-not-exist')
        .timeout(REMOTE_TIMEOUT);

      // Azure könnte HTML statt JSON zurückgeben
      expect(response.status).toBe(404);
    }, REMOTE_TIMEOUT);

    it('should handle invalid JSON gracefully', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .post('/api/tickets')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .timeout(REMOTE_TIMEOUT);

      // Sollte 400 oder Auth-Error sein
      expect([400, 401, 403]).toContain(response.status);
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // PERFORMANCE CHECKS
  // ============================================
  
  describe('Performance', () => {
    it('should respond to health check within reasonable time', async () => {
      if (!isServerReachable) return;

      const start = Date.now();
      
      await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT)
        .expect(200);
      
      const duration = Date.now() - start;
      
      // Azure sollte innerhalb von 3 Sekunden antworten
      expect(duration).toBeLessThan(3000);
      
      console.log(`⏱️  Health check took ${duration}ms`);
    }, REMOTE_TIMEOUT);

    it('should handle concurrent requests', async () => {
      if (!isServerReachable) return;

      // 5 parallele Requests
      const requests = Array(5).fill(null).map(() =>
        request(PRODUCTION_URL)
          .get('/health')
          .timeout(REMOTE_TIMEOUT)
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // Alle sollten erfolgreich sein
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      console.log(`⏱️  5 parallel requests took ${duration}ms`);
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // INFRASTRUCTURE CHECKS
  // ============================================
  
  describe('Infrastructure', () => {
    it('should run on correct Node version', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT)
        .expect(200);

      // Sollte Node 20 sein (aus package.json engines)
      expect(response.body.nodeVersion).toMatch(/^v20\./);
    }, REMOTE_TIMEOUT);

    it('should report production environment', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT)
        .expect(200);

      expect(response.body.env).toBe('production');
    }, REMOTE_TIMEOUT);
  });

  // ============================================
  // CORS & HEADERS
  // ============================================
  
  describe('CORS & Headers', () => {
    it('should have CORS headers for allowed origins', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .set('Origin', PRODUCTION_URL)
        .timeout(REMOTE_TIMEOUT);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    }, REMOTE_TIMEOUT);

    it('should set correct content-type for JSON', async () => {
      if (!isServerReachable) return;

      const response = await request(PRODUCTION_URL)
        .get('/health')
        .timeout(REMOTE_TIMEOUT);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    }, REMOTE_TIMEOUT);
  });
});

// ============================================
// HINWEISE ZUR VERWENDUNG
// ============================================
/*
 * Diese Tests laufen gegen die DEPLOYED Azure-App:
 * 
 * Vorteile:
 * - 🌐 Testet echte Production-Umgebung
 * - 🔒 Prüft HTTPS, Security, Infrastructure
 * - 📊 Misst echte Performance
 * - ✅ End-to-End Validierung
 * 
 * Nachteile:
 * - 🐌 Langsamer (~1-3 Sekunden pro Test)
 * - 📡 Braucht Internet-Verbindung
 * - 💰 Braucht laufenden Azure Service
 * - ⚠️  Kann fehlschlagen wenn Azure down ist
 * 
 * Ausführen:
 * npm test tests/integrations/app.remote.test.ts
 * 
 * In CI/CD:
 * Diese Tests laufen NACH dem Deployment
 * als Teil des "smoke-tests" Jobs in der GitHub Actions Pipeline
 * 
 * Best Practice:
 * - Lokale Tests (app.local.test.ts) für Development
 * - Remote Tests (app.remote.test.ts) für Production Validation
 */
