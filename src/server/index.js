// ============================================
// SERVER ENTRY POINT
// Startet den Express Server (importiert app.js)
// ============================================

import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './db.js';

// Azure setzt PORT automatisch
const PORT = process.env.PORT || 8080;

// Text-Index für Suche erstellen
async function createIndexes() {
  try {
    const db = await connectDB();
    const tickets = db.collection('tickets');
    
    // Index für Suche
    await tickets.createIndex({ 
      title: 'text', 
      description: 'text',
      id: 'text'
    });
    
    // Index für Filter
    await tickets.createIndex({ status: 1, priority: 1, assignee: 1 });
    await tickets.createIndex({ updatedAt: -1 });
    
    console.log('✅ Database indexes created');
  } catch (err) {
    console.error('Index creation failed:', err);
  }
}

// ============================================
// START SERVER (nur wenn nicht im Test-Mode)
// ============================================

if (process.env.NODE_ENV !== 'test') {
  console.log('=== Server Configuration ===');
  console.log('Current working directory:', process.cwd());
  console.log('Node version:', process.version);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('');

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
        return createIndexes();
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
} else {
  console.log('🧪 Running in TEST mode - Server not started');
}