import jwt from 'jsonwebtoken';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../rbac/roles.js';

// Generiert JWT-Token für User
export function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verifiziert JWT-Token
export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware zur Authentifizierungs-Prüfung
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Middleware zur Admin-Prüfung (Legacy, verwendet RBAC Permissions stattdessen)
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Optionale Auth - setzt User falls Token vorhanden
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

// Middleware-Factory: Prüft spezifische Permission
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }

    next();
  };
}

// Middleware-Factory: Prüft ob EINE der Permissions vorhanden
export function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasAnyPermission(req.user, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredAny: permissions 
      });
    }

    next();
  };
}

// Middleware-Factory: Prüft ob ALLE Permissions vorhanden
export function requireAllPermissions(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasAllPermissions(req.user, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredAll: permissions 
      });
    }

    next();
  };
}
