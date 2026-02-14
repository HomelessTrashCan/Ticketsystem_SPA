
// UNIT TESTS - Business-Logik

// Diese Tests prüfen die Business-Logik der Ticketsystem-App

import { describe, it, expect } from 'vitest';
import { 
  istStatusGueltig, 
  istPriorityGueltig,
  kannTicketSchliessen,
  sollKommentarfeldAnzeigen 
} from '../../src/utils/ticketHelpers';


// STATUS-VALIDIERUNG


describe('istStatusGueltig', () => {
  
  it('sollte true zurückgeben für gültige Status-Werte', () => {
    // ARRANGE & ACT & ASSERT
    expect(istStatusGueltig('open')).toBe(true);
    expect(istStatusGueltig('in_progress')).toBe(true);
    expect(istStatusGueltig('closed')).toBe(true);
  });

  it('sollte false zurückgeben für ungültige Status-Werte', () => {
    // ARRANGE & ACT & ASSERT
    expect(istStatusGueltig('invalid')).toBe(false);
    expect(istStatusGueltig('pending')).toBe(false);
    expect(istStatusGueltig('cancelled')).toBe(false);
  });

  it('sollte false zurückgeben für leere Strings', () => {
    expect(istStatusGueltig('')).toBe(false);
  });

  it('sollte case-sensitive sein', () => {
    // Status muss exakt lowercase sein
    expect(istStatusGueltig('Open')).toBe(false);
    expect(istStatusGueltig('OPEN')).toBe(false);
    expect(istStatusGueltig('In_Progress')).toBe(false);
  });
});


// PRIORITY-VALIDIERUNG

describe('istPriorityGueltig', () => {
  
  it('sollte true zurückgeben für gültige Priority-Werte', () => {
    expect(istPriorityGueltig('low')).toBe(true);
    expect(istPriorityGueltig('medium')).toBe(true);
    expect(istPriorityGueltig('high')).toBe(true);
  });

  it('sollte false zurückgeben für ungültige Priority-Werte', () => {
    expect(istPriorityGueltig('urgent')).toBe(false);
    expect(istPriorityGueltig('critical')).toBe(false);
    expect(istPriorityGueltig('normal')).toBe(false);
  });

  it('sollte false zurückgeben für leere Strings', () => {
    expect(istPriorityGueltig('')).toBe(false);
  });

  it('sollte case-sensitive sein', () => {
    expect(istPriorityGueltig('Low')).toBe(false);
    expect(istPriorityGueltig('HIGH')).toBe(false);
    expect(istPriorityGueltig('Medium')).toBe(false);
  });
});

// TICKET SCHLIESSEN - LOGIC

describe('kannTicketSchliessen', () => {
  
  it('sollte false zurückgeben wenn Ticket bereits geschlossen ist', () => {
    // ARRANGE
    const status = 'closed';
    const rolle = 'admin';
    const istEigenes = true;
    
    // ACT
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    // ASSERT
    expect(ergebnis).toBe(false);
    // Geschlossenes Ticket kann nicht nochmal geschlossen werden
  });

  it('sollte true zurückgeben wenn Admin offenes Ticket schliessen will', () => {
    const status = 'open';
    const rolle = 'admin';
    const istEigenes = false;  // Nicht sein eigenes Ticket
    
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    expect(ergebnis).toBe(true);
    // Admin kann alles schliessen
  });

  it('sollte true zurückgeben wenn Tech Support Ticket schliessen will', () => {
    const status = 'in_progress';
    const rolle = 'support';
    const istEigenes = false;
    
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    expect(ergebnis).toBe(true);
    // Tech Support kann alles schliessen
  });

  it('sollte true zurückgeben wenn User sein eigenes Ticket schliessen will', () => {
    const status = 'open';
    const rolle = 'user';
    const istEigenes = true;  // Ist sein eigenes Ticket
    
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    expect(ergebnis).toBe(true);
    // User kann eigene Tickets schliessen
  });

  it('sollte false zurückgeben wenn User fremdes Ticket schliessen will', () => {
    const status = 'open';
    const rolle = 'user';
    const istEigenes = false;  // NICHT sein eigenes Ticket
    
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    expect(ergebnis).toBe(false);
    // User kann keine fremden Tickets schliessen
  });

  it('sollte false zurückgeben für unbekannte Rollen', () => {
    const status = 'open';
    const rolle = 'guest';
    const istEigenes = true;
    
    const ergebnis = kannTicketSchliessen(status, rolle, istEigenes);
    
    expect(ergebnis).toBe(false);
    // Unbekannte Rolle = keine Berechtigung
  });
});

// KOMMENTARFELD SICHTBARKEIT

describe('sollKommentarfeldAnzeigen', () => {
  
  it('sollte true zurückgeben wenn Ticket offen ist (ohne Permission)', () => {
    // ARRANGE
    const status = 'open';
    const canCommentOnClosed = false;  // User hat KEINE Permission
    
    // ACT
    const ergebnis = sollKommentarfeldAnzeigen(status, canCommentOnClosed);
    
    // ASSERT
    expect(ergebnis).toBe(true);
    // Bei offenen Tickets immer Kommentarfeld anzeigen
  });

  it('sollte true zurückgeben wenn Ticket in_progress ist', () => {
    const status = 'in_progress';
    const canCommentOnClosed = false;
    
    const ergebnis = sollKommentarfeldAnzeigen(status, canCommentOnClosed);
    
    expect(ergebnis).toBe(true);
  });

  it('sollte false zurückgeben wenn Ticket geschlossen ist OHNE Permission', () => {
    // ARRANGE
    const status = 'closed';
    const canCommentOnClosed = false;  // User hat KEINE Permission
    
    // ACT
    const ergebnis = sollKommentarfeldAnzeigen(status, canCommentOnClosed);
    
    // ASSERT
    expect(ergebnis).toBe(false);
    // ❌ Kommentarfeld wird ausgeblendet
  });

  it('sollte true zurückgeben wenn Ticket geschlossen ist MIT Permission', () => {
    // ARRANGE
    const status = 'closed';
    const canCommentOnClosed = true;  // User hat Permission COMMENT_ADD_CLOSED
    
    // ACT
    const ergebnis = sollKommentarfeldAnzeigen(status, canCommentOnClosed);
    
    // ASSERT
    expect(ergebnis).toBe(true);
    // Admin/Tech Support kann trotzdem kommentieren
  });
});
