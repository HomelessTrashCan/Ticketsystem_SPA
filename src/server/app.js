import 'dotenv/config';
import express from "express";
import path from "path";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { promises as fs } from 'fs';
import ticketsRouter from "./api/tickets.js";
import agentsRouter from "./api/agents.js";
import authRouter from "./api/auth.js";
import passport from "./config/passport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// EXPRESS APP - Exportierbar für Tests
// ============================================

export const app = express();

// Trust Azure proxy for HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS Configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net'
  ],
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Session configuration (needed for passport)
// In test environment, use default secret if not set
const sessionSecret = process.env.SESSION_SECRET || 
  (process.env.NODE_ENV === 'test' ? 'test-secret-do-not-use-in-production' : null);

if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is not set');
}

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging (only in development/production, not in tests)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// HEALTH & DEBUG ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/test', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Server Test</title></head>
    <body>
      <h1>Server is RUNNING! ✅</h1>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Node: ${process.version}</p>
      <p>CWD: ${process.cwd()}</p>
      <p><a href="/health">Health Check</a></p>
      <p><a href="/debug/files">Debug Files</a></p>
      <p><a href="/">Try Homepage</a></p>
    </body>
    </html>
  `);
});

app.get('/debug/files', async (req, res) => {
  const distPath = path.join(process.cwd(), 'dist');
  try {
    const files = await fs.readdir(distPath, { withFileTypes: true });
    const structure = {};
    
    for (const file of files) {
      if (file.isDirectory()) {
        const subFiles = await fs.readdir(path.join(distPath, file.name));
        structure[file.name + '/'] = subFiles;
      } else {
        structure[file.name] = 'file';
      }
    }
    
    res.json({
      distPath,
      cwd: process.cwd(),
      files: structure
    });
  } catch (err) {
    res.status(500).json({ error: err.message, distPath });
  }
});

// ============================================
// API ROUTES
// ============================================

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/agents", agentsRouter);

// ============================================
// STATIC FILE SERVING (Production only)
// ============================================

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), "dist");
  
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));

  // Root route
  app.get('/', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html from root:', err);
        res.status(500).send(`Error loading application. File: ${indexPath}`);
      }
    });
  });

  // SPA Fallback
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send(`Error loading application. File not found: ${indexPath}`);
      }
    });
  });
}

// ============================================
// 404 HANDLER (muss am Ende sein)
// ============================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});
