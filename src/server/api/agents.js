import express from 'express';
import { getAllUsers } from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';
import { PERMISSIONS, ROLES, hasPermission } from '../rbac/roles.js';

const router = express.Router();

router.use(requireAuth);

// Gibt Liste der Agents zurück (Admin + Support User für Ticket-Zuweisung)
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    
    // Nur Admin und Support können Tickets zugewiesen werden
    const assignableUsers = users.filter((u) => 
      u.role === ROLES.ADMIN || u.role === ROLES.SUPPORT
    );
    
    const emails = assignableUsers.map((u) => u.email).filter(Boolean);
    
    res.json(emails);
  } catch (err) {
    console.error('GET /agents error', err);
    res.status(500).json({ error: 'Could not read agents' });
  }
});

export default router;
