/**
 * Environment Configuration Loader
 * Lädt automatisch die richtige .env-Datei basierend auf NODE_ENV
 */

import dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Lädt die .env-Datei basierend auf der aktuellen Umgebung
 *
 * Priorität:
 * 1. .env.{NODE_ENV} (z.B. .env.test, .env.development, .env.production)
 * 2. .env (fallback)
 */
export function loadEnvironment() {
  // Trim NODE_ENV um Leerzeichen zu entfernen (Windows-Problem mit "set VAR=value ")
  const nodeEnv = (process.env.NODE_ENV || 'development').trim();

  // Nutze process.cwd() statt relative Pfade - robuster!
  const projectRoot = process.cwd();

  // Versuche zuerst die spezifische .env-Datei zu laden
  const envFile = join(projectRoot, `.env.${nodeEnv}`);
  const fallbackEnvFile = join(projectRoot, '.env');

  if (existsSync(envFile)) {
    console.log(`📝 Loading environment from: .env.${nodeEnv}`);
    const result = dotenv.config({ path: envFile });
    if (result.error) {
      console.error('❌ Error loading .env file:', result.error);
    } else {
      console.log('✅ Environment variables loaded successfully');
    }
  } else if (existsSync(fallbackEnvFile)) {
    console.log(`📝 Loading environment from: .env (fallback)`);
    const result = dotenv.config({ path: fallbackEnvFile });
    if (result.error) {
      console.error('❌ Error loading .env file:', result.error);
    }
  } else {
    console.warn(`⚠️  No .env file found! Tried:`);
    console.warn(`   - ${envFile}`);
    console.warn(`   - ${fallbackEnvFile}`);
    console.warn(`   Current working directory: ${projectRoot}`);
  }

  // Stelle sicher, dass NODE_ENV gesetzt ist
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = nodeEnv;
  }

  return {
    nodeEnv: process.env.NODE_ENV,
    mongoUri: process.env.MONGO_URI,
    port: process.env.PORT || 8080
  };
}

// Auto-load wenn direkt importiert
loadEnvironment();
