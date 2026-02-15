/**
 * Frontend RBAC - Spiegelt Backend-Permissions (nur für UI, Backend validiert immer)
 */

export const ROLES = {
  ADMIN: 'admin',
  SUPPORT: 'support',
  USER: 'user',
  READONLY: 'readonly',
} as const;

export const PERMISSIONS = {
  TICKET_CREATE: 'ticket:create',
  TICKET_DELETE: 'ticket:delete',
  TICKET_VIEW_ALL: 'ticket:view:all',
  TICKET_VIEW_OWN: 'ticket:view:own',
  TICKET_EDIT_OWN: 'ticket:edit:own',
  TICKET_EDIT_ALL: 'ticket:edit:all',
  TICKET_CLOSE_OWN: 'ticket:close:own',
  TICKET_CLOSE_ALL: 'ticket:close:all',
  
  TICKET_ASSIGN: 'ticket:assign',
  TICKET_REASSIGN: 'ticket:reassign',
  
  PRIORITY_EDIT: 'priority:edit',
  PRIORITY_VIEW: 'priority:view',
  
  STATUS_CHANGE_ALL: 'status:change:all',
  STATUS_CHANGE_OWN: 'status:change:own',
  
  COMMENT_ADD: 'comment:add',
  COMMENT_ADD_CLOSED: 'comment:add:closed',
  COMMENT_DELETE: 'comment:delete',
  
  AGENTS_VIEW: 'agents:view',
  USERS_MANAGE: 'users:manage',
} as const;

type Role = typeof ROLES[keyof typeof ROLES];
type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export type { Permission, Role };

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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

export function hasPermission(userRole: string | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as Role] || [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: string | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}
