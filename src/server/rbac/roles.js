/**
 * RBAC-System: Definiert Rollen, Permissions und deren Zuordnung
 */

export const ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user',
  READONLY: 'readonly',
};

export const PERMISSIONS = {
  // Ticket permissions
  TICKET_CREATE: 'ticket:create',
  TICKET_DELETE: 'ticket:delete',
  TICKET_VIEW_ALL: 'ticket:view:all',
  TICKET_VIEW_OWN: 'ticket:view:own',
  TICKET_EDIT_OWN: 'ticket:edit:own',
  TICKET_EDIT_ALL: 'ticket:edit:all',
  TICKET_CLOSE_OWN: 'ticket:close:own',
  TICKET_CLOSE_ALL: 'ticket:close:all',
  
  // Assignment permissions
  TICKET_ASSIGN: 'ticket:assign',
  TICKET_REASSIGN: 'ticket:reassign',
  
  // Priority permissions
  PRIORITY_EDIT: 'priority:edit',
  PRIORITY_VIEW: 'priority:view',
  
  // Status permissions
  STATUS_CHANGE_ALL: 'status:change:all',
  STATUS_CHANGE_OWN: 'status:change:own',
  
  // Comment permissions
  COMMENT_ADD: 'comment:add',
  COMMENT_ADD_CLOSED: 'comment:add:closed',
  COMMENT_DELETE: 'comment:delete',
  
  // Agent/User management
  AGENTS_VIEW: 'agents:view',
  USERS_MANAGE: 'users:manage', // HINWEIS: Permission definiert, aber keine UI implementiert. Rollen müssen in MongoDB Atlas geändert werden.
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_DELETE,
    PERMISSIONS.TICKET_VIEW_ALL,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.TICKET_EDIT_OWN,
    PERMISSIONS.TICKET_EDIT_ALL,
    PERMISSIONS.TICKET_CLOSE_OWN,
    PERMISSIONS.TICKET_CLOSE_ALL,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_REASSIGN,
    PERMISSIONS.PRIORITY_EDIT,
    PERMISSIONS.PRIORITY_VIEW,
    PERMISSIONS.STATUS_CHANGE_ALL,
    PERMISSIONS.STATUS_CHANGE_OWN,
    PERMISSIONS.COMMENT_ADD,
    PERMISSIONS.COMMENT_ADD_CLOSED,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.AGENTS_VIEW,
    PERMISSIONS.USERS_MANAGE,
  ],
  
  [ROLES.SUPPORT]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW_ALL,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.TICKET_EDIT_OWN,
    PERMISSIONS.TICKET_EDIT_ALL,
    PERMISSIONS.TICKET_CLOSE_OWN,
    PERMISSIONS.TICKET_CLOSE_ALL,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.TICKET_REASSIGN,
    PERMISSIONS.PRIORITY_EDIT,
    PERMISSIONS.PRIORITY_VIEW,
    PERMISSIONS.STATUS_CHANGE_ALL,
    PERMISSIONS.STATUS_CHANGE_OWN,
    PERMISSIONS.COMMENT_ADD,
    PERMISSIONS.COMMENT_ADD_CLOSED,
    PERMISSIONS.AGENTS_VIEW,
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.TICKET_EDIT_OWN,
    PERMISSIONS.TICKET_CLOSE_OWN,
    PERMISSIONS.PRIORITY_VIEW,
    PERMISSIONS.STATUS_CHANGE_OWN,
    PERMISSIONS.COMMENT_ADD,
  ],
  
  [ROLES.READONLY]: [
    PERMISSIONS.TICKET_VIEW_ALL,
    PERMISSIONS.TICKET_VIEW_OWN,
    PERMISSIONS.PRIORITY_VIEW,
  ],
};

// Prüft ob User eine spezifische Permission hat
export function hasPermission(user, permission) {
  if (!user || !user.role) {
    return false;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

// Prüft ob User EINE der Permissions hat
export function hasAnyPermission(user, permissions) {
  return permissions.some(permission => hasPermission(user, permission));
}

// Prüft ob User ALLE Permissions hat
export function hasAllPermissions(user, permissions) {
  return permissions.every(permission => hasPermission(user, permission));
}

// Gibt alle Permissions einer User-Rolle zurück
export function getUserPermissions(user) {
  if (!user || !user.role) {
    return [];
  }
  
  return ROLE_PERMISSIONS[user.role] || [];
}
