import fs from 'fs';
import path from 'path';
import { connectDB, getClient } from './db.js';
import { agents as agentsList } from '../data/agents.js';

async function main() {
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

  try {
    await connectDB();
    const client = getClient();
    const db = client.db();
    const col = db.collection('tickets');

    if (docs.length === 0) {
      console.log('No documents to insert');
      return;
    }

    // Upsert each document by `id` to avoid duplicates
    for (const doc of docs) {
      if (!doc.id) continue;
      await col.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
    }

    try {
      await col.createIndex({ id: 1 }, { unique: true });
    } catch (e) {}

    console.log(`Imported ${docs.length} tickets into tickets collection`);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  } finally {
    const client = getClient();
    try { await client.close(); } catch (e) {}
  }

  // Ensure the counters.ticketid is at least the max existing ticket number
  try {
    await connectDB();
    const client = getClient();
    const db = client.db();
    const col = db.collection('tickets');
    const docs = await col.find({ id: { $regex: '^T-' } }).project({ id: 1 }).toArray();
    const nums = docs
      .map((d) => { const m = typeof d.id === 'string' && d.id.startsWith('T-') ? parseInt(d.id.slice(2)) : NaN; return isNaN(m) ? null : m; })
      .filter((n) => n !== null);
    const maxNum = nums.length ? Math.max(...nums) : 1000;
    const countersCol = db.collection('counters');
    // set seq to maxNum if current is less
    const cur = await countersCol.findOne({ _id: 'ticketid' });
    if (!cur || (cur && cur.seq < maxNum)) {
      await countersCol.updateOne({ _id: 'ticketid' }, { $set: { seq: maxNum } }, { upsert: true });
      console.log('Initialized counters.ticketid to', maxNum);
    }
  } catch (err) {
    console.error('Failed to initialize counters', err);
  } finally {
    const client = getClient();
    try { await client.close(); } catch (e) {}
  }

  // Also seed agents into `agents` collection
  // NOTE: With Google OAuth, agents are now stored in 'users' collection
  // This section is kept for backward compatibility but is optional
  try {
    await connectDB();
    const client = getClient();
    const db = client.db();
    const agentsCol = db.collection('agents');

    for (const email of agentsList) {
      if (!email) continue;
      await agentsCol.updateOne({ email }, { $set: { email } }, { upsert: true });
    }
    try { await agentsCol.createIndex({ email: 1 }, { unique: true }); } catch (e) {}
    console.log(`(Legacy) Imported ${agentsList.length} agents into agents collection`);
  } catch (err) {
    console.error('Agents seed failed (non-critical)', err);
  } finally {
    const client = getClient();
    try { await client.close(); } catch (e) {}
  }
}

main();
