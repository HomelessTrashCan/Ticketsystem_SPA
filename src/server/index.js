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
import { connectDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust Azure proxy for HTTPS
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Azure setzt PORT automatisch -> nicht fix auf 4000 verlassen
const PORT = process.env.PORT || 8080;

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
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set');
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Log all requests for debugging (BEFORE routes)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Debug endpoint to check file structure
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

// Simple test endpoint
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/agents", agentsRouter);

// Frontend (Vite build liegt im Projekt-Root: /dist)
const distPath = path.join(process.cwd(), "dist");
console.log('=== Server Configuration ===');
console.log('Static files path:', distPath);
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Serve static files with proper configuration
app.use(express.static(distPath, {
  index: false, // Don't auto-serve index.html, we'll handle it explicitly
  setHeaders: (res, filePath) => {
    console.log('Serving static file:', filePath);
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Explicit root route
app.get('/', (req, res) => {
  console.log('Root route requested, serving index.html');
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html from root:', err);
      console.error('Tried to serve from:', indexPath);
      res.status(500).send(`Error loading application. File: ${indexPath}`);
    }
  });
});

// SPA-Fallback (React Router)
// Serve index.html for all non-API routes (must be last)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  
  console.log('SPA fallback for:', req.path);
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      console.error('Path attempted:', indexPath);
      res.status(500).send(`Error loading application. File not found: ${indexPath}`);
    }
  });
});

// Start server IMMEDIATELY (don't wait for MongoDB)
console.log('=== Starting Express Server ===');
app.listen(PORT, () => {
  console.log(`✓ Server listening on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Node version: ${process.version}`);
  console.log('');
  
  // Try to connect to MongoDB in the background
  console.log('Attempting MongoDB connection...');
  connectDB()
    .then(() => {
      console.log('✓ MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.error('⚠️  Server is running but database features will not work');
      console.error('⚠️  Check your MONGO_URI configuration');
      if (process.version.startsWith('v18')) {
        console.error('⚠️  You are using Node.js 18 which has SSL issues with MongoDB');
        console.error('⚠️  Please upgrade to Node.js 20 LTS in Azure Portal');
      }
    });
});