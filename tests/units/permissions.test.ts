// ============================================
// UNIT TESTS - RBAC Berechtigungen
// ============================================
// Diese Tests prüfen das Rollen-/Berechtigungssystem
// Jede Rolle hat bestimmte Permissions — hier prüfen wir,
// ob die Zuordnung korrekt funktioniert.

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../../src/rbac/permissions';

// ============================================
// hasPermission() — Einzelne Berechtigung prüfen
// ============================================

describe('hasPermission', () => {

  // --- ADMIN: Hat alle Berechtigungen ---

  it('Admin sollte Tickets erstellen dürfen', () => {
    const rolle = ROLES.ADMIN;
    const permission = PERMISSIONS.TICKET_CREATE;

    const ergebnis = hasPermission(rolle, permission);

    expect(ergebnis).toBe(true);
  });

  it('Admin sollte Tickets löschen dürfen', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.TICKET_DELETE)).toBe(true);
  });

  it('Admin sollte User verwalten dürfen', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_MANAGE)).toBe(true);
  });

  // --- SUPPORT: Hat die meisten, aber NICHT alle ---

  it('Support sollte Tickets erstellen dürfen', () => {
    expect(hasPermission(ROLES.SUPPORT, PERMISSIONS.TICKET_CREATE)).toBe(true);
  });

  it('Support sollte Tickets NICHT löschen dürfen', () => {
    // Support hat kein TICKET_DELETE — nur Admin darf löschen
    expect(hasPermission(ROLES.SUPPORT, PERMISSIONS.TICKET_DELETE)).toBe(false);
  });

  it('Support sollte User NICHT verwalten dürfen', () => {
    expect(hasPermission(ROLES.SUPPORT, PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  it('Support sollte geschlossene Tickets kommentieren dürfen', () => {
    expect(hasPermission(ROLES.SUPPORT, PERMISSIONS.COMMENT_ADD_CLOSED)).toBe(true);
  });

  // --- USER: Eingeschränkte Berechtigungen ---

  it('User sollte eigene Tickets erstellen dürfen', () => {
    expect(hasPermission(ROLES.USER, PERMISSIONS.TICKET_CREATE)).toBe(true);
  });

  it('User sollte eigene Tickets sehen dürfen', () => {
    expect(hasPermission(ROLES.USER, PERMISSIONS.TICKET_VIEW_OWN)).toBe(true);
  });

  it('User sollte NICHT alle Tickets sehen dürfen', () => {
    // User sieht nur eigene Tickets, nicht alle
    expect(hasPermission(ROLES.USER, PERMISSIONS.TICKET_VIEW_ALL)).toBe(false);
  });

  it('User sollte NICHT Tickets zuweisen dürfen', () => {
    expect(hasPermission(ROLES.USER, PERMISSIONS.TICKET_ASSIGN)).toBe(false);
  });

  // --- READONLY: Nur anschauen ---

  it('Readonly sollte eigene Tickets sehen dürfen', () => {
    expect(hasPermission(ROLES.READONLY, PERMISSIONS.TICKET_VIEW_OWN)).toBe(true);
  });

  it('Readonly sollte Prioritäten sehen dürfen', () => {
    expect(hasPermission(ROLES.READONLY, PERMISSIONS.PRIORITY_VIEW)).toBe(true);
  });

  it('Readonly sollte KEINE Tickets erstellen dürfen', () => {
    expect(hasPermission(ROLES.READONLY, PERMISSIONS.TICKET_CREATE)).toBe(false);
  });

  it('Readonly sollte NICHT kommentieren dürfen', () => {
    expect(hasPermission(ROLES.READONLY, PERMISSIONS.COMMENT_ADD)).toBe(false);
  });

  // --- EDGE CASES: Ungültige Eingaben ---

  it('sollte false zurückgeben für undefined Rolle', () => {
    expect(hasPermission(undefined, PERMISSIONS.TICKET_CREATE)).toBe(false);
  });

  it('sollte false zurückgeben für unbekannte Rolle', () => {
    expect(hasPermission('guest', PERMISSIONS.TICKET_CREATE)).toBe(false);
  });

  it('sollte false zurückgeben für leeren String als Rolle', () => {
    expect(hasPermission('', PERMISSIONS.TICKET_CREATE)).toBe(false);
  });
});

// ============================================
// hasAnyPermission() — Mindestens EINE Berechtigung
// ============================================

describe('hasAnyPermission', () => {

  it('User sollte true bekommen wenn er mindestens eine Permission hat', () => {
    // User hat TICKET_CREATE, aber nicht TICKET_DELETE
    const permissions = [PERMISSIONS.TICKET_CREATE, PERMISSIONS.TICKET_DELETE];

    const ergebnis = hasAnyPermission(ROLES.USER, permissions);

    expect(ergebnis).toBe(true);
    // Weil TICKET_CREATE vorhanden ist, reicht das
  });

  it('Readonly sollte false bekommen wenn er keine der Permissions hat', () => {
    // Readonly hat weder CREATE noch DELETE
    const permissions = [PERMISSIONS.TICKET_CREATE, PERMISSIONS.TICKET_DELETE];

    const ergebnis = hasAnyPermission(ROLES.READONLY, permissions);

    expect(ergebnis).toBe(false);
  });

  it('Admin sollte true bekommen für beliebige Permissions', () => {
    const permissions = [PERMISSIONS.TICKET_DELETE, PERMISSIONS.USERS_MANAGE];

    expect(hasAnyPermission(ROLES.ADMIN, permissions)).toBe(true);
  });

  it('sollte false zurückgeben für undefined Rolle', () => {
    const permissions = [PERMISSIONS.TICKET_CREATE];

    expect(hasAnyPermission(undefined, permissions)).toBe(false);
  });
});

// ============================================
// hasAllPermissions() — ALLE Berechtigungen nötig
// ============================================

describe('hasAllPermissions', () => {

  it('Admin sollte alle abgefragten Permissions haben', () => {
    const permissions = [
      PERMISSIONS.TICKET_CREATE,
      PERMISSIONS.TICKET_DELETE,
      PERMISSIONS.USERS_MANAGE,
    ];

    const ergebnis = hasAllPermissions(ROLES.ADMIN, permissions);

    expect(ergebnis).toBe(true);
    // Admin hat wirklich ALLE davon
  });

  it('Support sollte NICHT alle Admin-Permissions haben', () => {
    const permissions = [
      PERMISSIONS.TICKET_CREATE,
      PERMISSIONS.TICKET_DELETE,  // Support hat das NICHT
    ];

    const ergebnis = hasAllPermissions(ROLES.SUPPORT, permissions);

    expect(ergebnis).toBe(false);
    // Weil TICKET_DELETE fehlt, ist das Ergebnis false
  });

  it('User sollte alle eigenen Basis-Permissions haben', () => {
    const permissions = [
      PERMISSIONS.TICKET_CREATE,
      PERMISSIONS.TICKET_VIEW_OWN,
      PERMISSIONS.COMMENT_ADD,
    ];

    expect(hasAllPermissions(ROLES.USER, permissions)).toBe(true);
  });

  it('sollte false zurückgeben für undefined Rolle', () => {
    const permissions = [PERMISSIONS.TICKET_CREATE];

    expect(hasAllPermissions(undefined, permissions)).toBe(false);
  });
});

// ============================================
// ROLE_PERMISSIONS Konfiguration — Konsistenz
// ============================================

describe('ROLE_PERMISSIONS Konfiguration', () => {

  it('Admin sollte die meisten Permissions haben', () => {
    const adminCount = ROLE_PERMISSIONS[ROLES.ADMIN].length;
    const supportCount = ROLE_PERMISSIONS[ROLES.SUPPORT].length;
    const userCount = ROLE_PERMISSIONS[ROLES.USER].length;

    // Admin > Support > User
    expect(adminCount).toBeGreaterThan(supportCount);
    expect(supportCount).toBeGreaterThan(userCount);
  });

  it('Readonly sollte die wenigsten Permissions haben', () => {
    const readonlyCount = ROLE_PERMISSIONS[ROLES.READONLY].length;
    const userCount = ROLE_PERMISSIONS[ROLES.USER].length;

    expect(readonlyCount).toBeLessThan(userCount);
  });

  it('jede Rolle sollte mindestens eine Permission haben', () => {
    // Keine Rolle sollte komplett leer sein
    expect(ROLE_PERMISSIONS[ROLES.ADMIN].length).toBeGreaterThan(0);
    expect(ROLE_PERMISSIONS[ROLES.SUPPORT].length).toBeGreaterThan(0);
    expect(ROLE_PERMISSIONS[ROLES.USER].length).toBeGreaterThan(0);
    expect(ROLE_PERMISSIONS[ROLES.READONLY].length).toBeGreaterThan(0);
  });
});
