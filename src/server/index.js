import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import ticketsRouter from './api/tickets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Data file: src/data/tickethistory.json
const DATA_FILE = path.join(__dirname, '..', 'data', 'tickethistory.json');

/*
async function readTickets() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
*/

app.use('/api/tickets', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Ticket server listening on http://localhost:${PORT}`);
  /*
  console.log(`Data file: ${DATA_FILE}`);
  */
});