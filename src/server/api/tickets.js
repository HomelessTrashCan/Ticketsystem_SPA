import express from 'express';
import { connectDB, getClient } from '../db/db.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS, hasPermission } from '../rbac/roles.js';

const router = express.Router();

// ============================================
// VALIDATION HELPERS (Server-seitig)
// ============================================
// Diese Validierungslogik entspricht ticketHelpers.ts
// und ist mit Unit-Tests getestet!

function istTitelGueltig(titel) {
  if (!titel || typeof titel !== 'string') return false;
  const bereinigt = titel.trim();
  if (bereinigt.length < 3) return false;
  if (bereinigt.length > 100) return false;
  return true;
}

function istBeschreibungGueltig(beschreibung) {
  if (!beschreibung || typeof beschreibung !== 'string') return false;
  const bereinigt = beschreibung.trim();
  if (bereinigt.length < 3) return false;
  if (bereinigt.length > 100) return false;
  return true;
}




async function getTicketsCollection() {
  const db = await connectDB();
  return db.collection('tickets');
}

async function getNextTicketNum() {
  const db = await connectDB();
  const col = db.collection('counters');
  
  // Atomares Inkrement der Ticket-Nummer
  let res;
  try {
    res = await col.findOneAndUpdate(
      { _id: 'ticketid' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (e) {
    throw e;
  }

  if (res) {
    if (res.value && typeof res.value.seq === 'number') return res.value.seq;
    if (typeof res.seq === 'number') return res.seq;
    if (res && typeof res === 'object' && typeof res._id === 'string' && typeof res.seq === 'number') return res.seq;
  }

  // Fallback für ältere MongoDB-Treiber
  try {
    const res2 = await col.findOneAndUpdate(
      { _id: 'ticketid' },
      { $inc: { seq: 1 } },
      { upsert: true, returnOriginal: false }
    );
    if (res2 && res2.value && typeof res2.value.seq === 'number') return res2.value.seq;
    if (res2 && typeof res2.seq === 'number') return res2.seq;
  } catch (e) {}

  // Letzter Versuch: Update + separate Abfrage
  try {
    await col.updateOne({ _id: 'ticketid' }, { $inc: { seq: 1 } }, { upsert: true });
    const doc = await col.findOne({ _id: 'ticketid' });
    if (doc && typeof doc.seq === 'number') return doc.seq;
  } catch (e) {}

  // Initialisierung falls Counter nicht existiert
  const cur = await col.findOne({ _id: 'ticketid' });
  if (!cur) {
    await col.insertOne({ _id: 'ticketid', seq: 1000 });
    return 1000;
  }

  throw new Error('Could not obtain next ticket seq');
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const col = await getTicketsCollection();
    
    // Basis-Filter (RBAC bleibt)
    const canViewAll = hasPermission(req.user, PERMISSIONS.TICKET_VIEW_ALL);
    const baseFilter = canViewAll ? {} : { createdBy: req.user.id };
    
    // Query-Parameter auslesen
    const { 
      status, 
      priority, 
      assignee, 
      search,
      page = 1,
      limit = 5
    } = req.query;
    
    // Filter erweitern
    const filter = { ...baseFilter };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (assignee && assignee !== 'all') {
      filter.assignee = assignee;
    }
    
    // Text-Suche (benötigt MongoDB Text Index)
    if (search && search.trim()) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { requester: { $regex: search, $options: 'i' } },
        { assignee: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination berechnen
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Zähle total (für Pagination Info)
    const total = await col.countDocuments(filter);
    
    // Hole gefilterte + paginierte Tickets
    const tickets = await col
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();
    
    // Response mit Pagination-Metadaten
    res.json({
      data: tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + tickets.length < total
      }
    });
  } catch (err) {
    console.error('GET /tickets error', err);
    res.status(500).json({ error: 'Could not read tickets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    
    // Basis-Validierung
    if (!body || !body.title || !body.description) {
      return res.status(400).json({ error: 'Missing title or description' });
    }
    
    // Erweiterte Validierung mit Unit-getesteten Funktionen
    if (!istTitelGueltig(body.title)) {
      return res.status(400).json({ 
        error: 'Invalid title',
        details: 'Titel muss zwischen 3 und 100 Zeichen lang sein'
      });
    }


  if (!istBeschreibungGueltig(body.description)) {
      return res.status(400).json({ 
        error: 'Invalid description',
        details: 'Beschreibung muss zwischen 3 und 100 Zeichen lang sein'
      });
    }


    const col = await getTicketsCollection();
    
    // Sequentielle Ticket-Nummer generieren
    const nextNum = await getNextTicketNum();
    const id = `T-${nextNum}`;
    const now = new Date().toISOString();

    // Permissions für erweiterte Felder prüfen
    const canEditPriority = hasPermission(req.user, PERMISSIONS.PRIORITY_EDIT);
    const canAssign = hasPermission(req.user, PERMISSIONS.TICKET_ASSIGN);

    const created = {
      id,
      title: String(body.title),
      description: String(body.description),
      status: body.status || 'open',
      priority: canEditPriority ? (body.priority || 'medium') : 'medium',
      requester: req.user.email,
      assignee: canAssign ? body.assignee : undefined,
      createdBy: req.user.id,
      createdAt: now,
      updatedAt: now,
      comments: body.comments || [],
    };

    await col.insertOne(created);
    try { await col.createIndex({ id: 1 }, { unique: true }); } catch (e) {}

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

    const col = await getTicketsCollection();
    const existing = await col.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'Ticket not found' });

    // Bearbeitungsrechte prüfen
    const canEditAll = hasPermission(req.user, PERMISSIONS.TICKET_EDIT_ALL);
    const canEditOwn = hasPermission(req.user, PERMISSIONS.TICKET_EDIT_OWN);
    const isOwner = existing.createdBy === req.user.id;
    
    if (!canEditAll && !(canEditOwn && isOwner)) {
      return res.status(403).json({ error: 'You can only edit your own tickets' });
    }

    // Kommentare auf geschlossene Tickets nur mit Permission
    const canCommentOnClosed = hasPermission(req.user, PERMISSIONS.COMMENT_ADD_CLOSED);
    if (!canCommentOnClosed && existing.status === 'closed' && body.comments !== undefined) {
      return res.status(403).json({ error: 'Cannot add comments to closed tickets' });
    }

    // Feldspezifische Permissions prüfen
    const canEditPriority = hasPermission(req.user, PERMISSIONS.PRIORITY_EDIT);
    const canAssign = hasPermission(req.user, PERMISSIONS.TICKET_ASSIGN);
    const canChangeStatusAll = hasPermission(req.user, PERMISSIONS.STATUS_CHANGE_ALL);
    const canChangeStatusOwn = hasPermission(req.user, PERMISSIONS.STATUS_CHANGE_OWN);
    
    const updated = {
      ...existing,
      title: body.title !== undefined ? String(body.title) : existing.title,
      description: body.description !== undefined ? String(body.description) : existing.description,
      status: body.status !== undefined && (canChangeStatusAll || (canChangeStatusOwn && isOwner)) 
        ? body.status 
        : existing.status,
      priority: canEditPriority && body.priority !== undefined ? body.priority : existing.priority,
      assignee: canAssign && body.assignee !== undefined ? body.assignee : existing.assignee,
      comments: body.comments !== undefined ? body.comments : existing.comments,
      updatedAt: new Date().toISOString(),
    };

    await col.updateOne({ id }, { $set: updated });
    res.json(updated);
  } catch (err) {
    console.error('PUT /tickets/:id error', err);
    res.status(500).json({ error: 'Could not update ticket' });
  }
});

router.delete('/:id', requirePermission(PERMISSIONS.TICKET_DELETE), async (req, res) => {
  try {
    const { id } = req.params;
    const col = await getTicketsCollection();
    const existing = await col.findOne({ id });
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    const del = await col.deleteOne({ id });
    if (del.deletedCount !== 1) {
      return res.status(500).json({ error: 'Could not delete ticket' });
    }
    res.json(existing);
  } catch (err) {
    console.error('DELETE /tickets/:id error', err);
    res.status(500).json({ error: 'Could not delete ticket' });
  }
});

export default router;