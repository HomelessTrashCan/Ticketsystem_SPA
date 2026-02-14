import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('ERROR: MONGO_URI environment variable is not set!');
  throw new Error('MONGO_URI not set');
}

// MongoDB connection options for better compatibility with Azure and SSL
const options = {
  tls: true,
  tlsAllowInvalidCertificates: true, // Allow invalid certs for Azure compatibility
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  retryReads: true,
};

const client = new MongoClient(uri, options);

let db = null;

export async function connectDB() {
  try {
    await client.connect();
    // Nutze die Datenbank aus der MONGO_URI (zwischen letztem / und ?)
    db = client.db(); // Verwendet automatisch die DB aus der Connection String
    const dbName = db.databaseName;
    console.log('Connected to MongoDB successfully');
    console.log(`Using database: ${dbName}`);
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('MONGO_URI is set:', !!uri);
    console.error('MONGO_URI starts with:', uri ? uri.substring(0, 25) + '...' : 'NOT SET');
    throw err;
  }
}

export function getDB() { 
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db; 
}

export function getClient() { return client; }  