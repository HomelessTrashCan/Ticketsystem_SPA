import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'tickethistory.json');

const router = express.Router();

async function readTickets() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeTickets(tickets) {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
  const tmp = DATA_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(tickets, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
}

router.get('/', async (req, res) => {
  try {
    const tickets = await readTickets();
    res.json(tickets);
  } catch (err) {
    console.error('GET /tickets error', err);
    res.status(500).json({ error: 'Could not read tickets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.title || !body.description) {
      return res.status(400).json({ error: 'Missing title or description' });
    }

    const tickets = await readTickets();

    // id generation: T-<number>
    const existingNums = tickets
      .map((t) => (typeof t.id === 'string' && t.id.startsWith('T-') ? parseInt(t.id.slice(2)) : NaN))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length ? Math.max(...existingNums) + 1 : 1001;
    const id = `T-${nextNum}`;
    const now = new Date().toISOString();

    const created = {
      id,
      title: String(body.title),
      description: String(body.description),
      status: body.status || 'open',
      priority: body.priority || 'medium',
      requester: body.requester || 'unknown',
      assignee: body.assignee || undefined,
      createdAt: now,
      updatedAt: now,
      comments: body.comments || [],
    };

    tickets.push(created);
    await writeTickets(tickets);

    res.status(201).json(created);
  } catch (err) {
    console.error('POST /tickets error', err);
    res.status(500).json({ error: 'Could not write ticket' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const tickets = await readTickets();
    const index = tickets.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update fields
    const updated = {
      ...tickets[index],
      title: body.title !== undefined ? String(body.title) : tickets[index].title,
      description: body.description !== undefined ? String(body.description) : tickets[index].description,
      status: body.status !== undefined ? body.status : tickets[index].status,
      priority: body.priority !== undefined ? body.priority : tickets[index].priority,
      assignee: body.assignee !== undefined ? body.assignee : tickets[index].assignee,
      comments: body.comments !== undefined ? body.comments : tickets[index].comments,
      updatedAt: new Date().toISOString(),
    };

    tickets[index] = updated;
    await writeTickets(tickets);

    res.json(updated);
  } catch (err) {
    console.error('PUT /tickets/:id error', err);
    res.status(500).json({ error: 'Could not update ticket' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tickets = await readTickets();
    const index = tickets.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const deleted = tickets[index];
    tickets.splice(index, 1);
    await writeTickets(tickets);

    res.json(deleted);
  } catch (err) {
    console.error('DELETE /tickets/:id error', err);
    res.status(500).json({ error: 'Could not delete ticket' });
  }
});


export default router;