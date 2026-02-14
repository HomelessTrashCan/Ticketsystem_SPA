import '../config/env.js'; // Lädt automatisch die richtige .env-Datei
import fs from 'fs';
import path from 'path';
import { connectDB, getClient } from './db.js';
import { agents as agentsList } from '../../data/agents.js';

async function main() {
  // ============================================
  // 1. Load and parse tickethistory.json
  // ============================================
  const file = path.join(process.cwd(), 'src', 'data', 'tickethistory.json');
  if (!fs.existsSync(file)) {
    console.error('tickethistory.json not found at', file);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, { encoding: 'utf8' });
  let docs;
  try {
    docs = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON', e);
    process.exit(1);
  }

  if (!Array.isArray(docs)) {
    console.error('Expected an array of tickets in tickethistory.json');
    process.exit(1);
  }

  // ============================================
  // 2. Connect to database ONCE and perform all operations
  // ============================================
  try {
    await connectDB();
    const client = getClient();
    const db = client.db();

    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${db.databaseName}`);
    console.log('');

    // ============================================
    // 2a. Seed tickets
    // ============================================
    const ticketsCol = db.collection('tickets');

    if (docs.length === 0) {
      console.log('⚠️  No documents to insert');
    } else {
      // Upsert each document by `id` to avoid duplicates
      for (const doc of docs) {
        if (!doc.id) continue;
        await ticketsCol.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
      }

      try {
        await ticketsCol.createIndex({ id: 1 }, { unique: true });
      } catch (e) {}

      console.log(`✅ Imported ${docs.length} tickets into tickets collection`);
    }

    // ============================================
    // 2b. Initialize counters
    // ============================================
    const ticketDocs = await ticketsCol.find({ id: { $regex: '^T-' } }).project({ id: 1 }).toArray();
    const nums = ticketDocs
      .map((d) => {
        const m = typeof d.id === 'string' && d.id.startsWith('T-') ? parseInt(d.id.slice(2)) : NaN;
        return isNaN(m) ? null : m;
      })
      .filter((n) => n !== null);
    const maxNum = nums.length ? Math.max(...nums) : 1000;

    const countersCol = db.collection('counters');
    const cur = await countersCol.findOne({ _id: 'ticketid' });
    if (!cur || (cur && cur.seq < maxNum)) {
      await countersCol.updateOne({ _id: 'ticketid' }, { $set: { seq: maxNum } }, { upsert: true });
      console.log(`✅ Initialized counters.ticketid to ${maxNum}`);
    } else {
      console.log(`✓ Counter already at ${cur.seq} (no update needed)`);
    }

    // ============================================
    // 2c. Seed agents (legacy, for backward compatibility)
    // ============================================
    const agentsCol = db.collection('agents');
    for (const email of agentsList) {
      if (!email) continue;
      await agentsCol.updateOne({ email }, { $set: { email } }, { upsert: true });
    }
    try {
      await agentsCol.createIndex({ email: 1 }, { unique: true });
    } catch (e) {}
    console.log(`✅ (Legacy) Imported ${agentsList.length} agents into agents collection`);

    console.log('');
    console.log('🎉 Seed completed successfully!');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    // Close connection only once at the very end
    const client = getClient();
    try {
      await client.close();
      console.log('✓ Database connection closed');
    } catch (e) {
      console.error('Error closing connection:', e);
    }
  }
}

main();
