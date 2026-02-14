/**
 * Prüft ob ein Ticket-Titel gültig ist
 * Ein Titel ist gültig wenn:
 * - Er nicht leer ist
 * - Er mindestens 3 Zeichen hat
 * - Er maximal 100 Zeichen hat
 */
export function istTitelGueltig(titel: string): boolean {
  // Prüfe ob Titel existiert und ein String ist
  if (!titel || typeof titel !== 'string') {
    return false;
  }

  // Entferne Leerzeichen am Anfang und Ende
  const bereinigterTitel = titel.trim();

  // Prüfe Länge
  if (bereinigterTitel.length < 3) {
    return false; // Zu kurz
  }

  if (bereinigterTitel.length > 100) {
    return false; // Zu lang
  }

  return true; // Alles gut!
}

export function istBeschreibungGueltig(beschreibung: string): boolean {
  // Prüfe ob Beschreibung existiert und ein String ist
  if (!beschreibung || typeof beschreibung !== 'string') {
    return false;
  }

  // Entferne Leerzeichen am Anfang und Ende
  const bereinigterBeschreibung = beschreibung.trim();

  // Prüfe Länge
  if (bereinigterBeschreibung.length < 3) {
    return false; // Zu kurz
  }

  if (bereinigterBeschreibung.length > 100) {
    return false; // Zu lang
  }

  return true; // Alles gut!
}

export function istKommentarGueltig(kommentar: string): boolean {
  // Prüfe ob Kommentar existiert und ein String ist
  if (!kommentar || typeof kommentar !== 'string') {
    return false;
  }

  // Entferne Leerzeichen am Anfang und Ende
  const bereinigterKommentar = kommentar.trim();

  // Prüfe Länge
  if (!bereinigterKommentar ) {
    return false; // null, undefined oder nur Leerzeichen
  }

  if (bereinigterKommentar.length > 500) {
    return false; // Zu lang
  }

  return true; // Alles gut!
}



export function istStatusGueltig(status: string): boolean {
  return ['open', 'in_progress', 'closed'].includes(status);
}

export function istPriorityGueltig(priority: string): boolean {
  return ['low', 'medium', 'high'].includes(priority);
}

export function kannTicketSchliessen(
  ticketStatus: string,
  userRole: string,
  istEigeneTicket: boolean
): boolean {
  if (ticketStatus === 'closed') return false;  // Schon geschlossen
  
  // Admin kann alles schliessen
  if (userRole === 'admin' || userRole === 'support') {
    return true;
  }
  
  // User kann nur eigene Tickets schliessen
  return userRole === 'user' && istEigeneTicket;
}

export function sollKommentarfeldAnzeigen(
  ticketStatus: string,
  canCommentOnClosed: boolean
): boolean {
  if (ticketStatus !== 'closed') return true;
  return canCommentOnClosed;
}