// ============================================
// UNIT TEST BEISPIEL - Schritt für Schritt
// ============================================

// SCHRITT 1: Importiere die Test-Tools von Vitest
import { describe, it, expect } from 'vitest';

// SCHRITT 2: Importiere die Funktion, die wir testen wollen
import { istBeschreibungGueltig, istTitelGueltig, istKommentarGueltig } from '../../src/utils/ticketHelpers';


// ============================================
// Was ist ein Unit-Test?
// ============================================
// Ein Unit-Test testet eine EINZELNE Funktion isoliert.
// Wir prüfen: "Gibt die Funktion das richtige Ergebnis zurück?"

// ============================================
// SCHRITT 3: Gruppiere die Tests mit "describe"
// ============================================
describe('istTitelGueltig', () => {
  // "describe" ist wie ein Ordner für zusammengehörige Tests
  // Der Name beschreibt, WAS wir testen

  // ============================================
  // SCHRITT 4: Schreibe einzelne Test-Fälle mit "it"
  // ============================================

  // TEST 1: Prüfe GÜLTIGE Titel
  it('sollte true zurückgeben für gültige Titel', () => {
    // ARRANGE (Vorbereitung): Definiere Test-Daten
    const gueltiger_titel = 'Bug im Login';

    // ACT (Ausführung): Rufe die Funktion auf
    const ergebnis = istTitelGueltig(gueltiger_titel);

    // ASSERT (Überprüfung): Prüfe ob das Ergebnis stimmt
    expect(ergebnis).toBe(true);
    // Das bedeutet: "Ich ERWARTE, dass ergebnis TRUE ist"
  });

  // TEST 2: Prüfe zu kurze Titel
  it('sollte false zurückgeben für zu kurze Titel', () => {
    // ARRANGE: Titel mit nur 2 Zeichen (zu kurz!)
    const zu_kurz = 'Hi';

    // ACT: Funktion ausführen
    const ergebnis = istTitelGueltig(zu_kurz);

    // ASSERT: Erwarten dass false zurückkommt
    expect(ergebnis).toBe(false);
    // Weil "Hi" nur 2 Zeichen hat, aber mindestens 3 nötig sind
  });

  // TEST 3: Prüfe leere Strings
  it('sollte false zurückgeben für leere Titel', () => {
    // ARRANGE
    const leer = '';

    // ACT
    const ergebnis = istTitelGueltig(leer);

    // ASSERT
    expect(ergebnis).toBe(false);
    // Ein leerer Titel ist nicht gültig
  });

  // TEST 4: Prüfe zu lange Titel
  it('sollte false zurückgeben für zu lange Titel', () => {
    // ARRANGE: String mit 101 Zeichen (zu lang!)
    const zu_lang = 'A'.repeat(101); // "AAA..." 101x

    // ACT
    const ergebnis = istTitelGueltig(zu_lang);

    // ASSERT
    expect(ergebnis).toBe(false);
    // Titel darf maximal 100 Zeichen haben
  });

  // TEST 5: Prüfe Titel mit Leerzeichen an den Enden
  it('sollte Leerzeichen am Anfang/Ende ignorieren', () => {
    // ARRANGE: 3 Buchstaben + Leerzeichen
    const mit_leerzeichen = '  Test  ';

    // ACT
    const ergebnis = istTitelGueltig(mit_leerzeichen);

    // ASSERT
    expect(ergebnis).toBe(true);
    // Nach trim() ist "Test" = 4 Zeichen → gültig!
  });
});

describe('istBeschreibungGueltig', () => {

  it('sollte true zurückgeben für gültige Beschreibungen', () => {
    const gueltige_beschreibung = 'Dies ist eine gültige Beschreibung';

    const ergebnis = istBeschreibungGueltig(gueltige_beschreibung);

    expect(ergebnis).toBe(true);
  });

  it('sollte false zurückgeben für zu kurze Beschreibungen', () => {
    const zu_kurz = 'Hi';

    const ergebnis = istBeschreibungGueltig(zu_kurz);

    expect(ergebnis).toBe(false);
  });

  it('sollte false zurückgeben für leere Beschreibungen', () => {
    const leer = '';

    const ergebnis = istBeschreibungGueltig(leer);

    expect(ergebnis).toBe(false);
  });

  it('sollte false zurückgeben für zu lange Beschreibungen', () => {
    const zu_lang = 'A'.repeat(101);

    const ergebnis = istBeschreibungGueltig(zu_lang);

    expect(ergebnis).toBe(false);
  });
});

describe('istKommentarGueltig', () => {

  it('sollte true zurückgeben für gültige Kommentare', () => {
    const gueltiger_kommentar = 'Dies ist ein gültiger Kommentar';
    const ergebnis = istKommentarGueltig(gueltiger_kommentar);
    expect(ergebnis).toBe(true);
  });

  it('sollte false zurückgeben für leere Kommentare (button-click ohne Text)', () => {
    // ARRANGE: User hat nichts eingegeben
    const leer = '';

    // ACT: Validierung wird aufgerufen
    const ergebnis = istKommentarGueltig(leer);

    // ASSERT: Muss false sein - Kommentar wird NICHT abgesendet
    expect(ergebnis).toBe(false);
  });

  it('sollte false zurückgeben für Kommentare mit nur Leerzeichen', () => {
    // ARRANGE: User hat nur Leerzeichen eingegeben
    const nur_leerzeichen = '   ';

    // ACT
    const ergebnis = istKommentarGueltig(nur_leerzeichen);

    // ASSERT: Nach trim() ist es leer → false
    expect(ergebnis).toBe(false);
  });

  it('sollte false zurückgeben für zu lange Kommentare', () => {
    // ARRANGE: Kommentar mit 501 Zeichen (zu lang!)
    const zu_lang = 'A'.repeat(501);

    // ACT
    const ergebnis = istKommentarGueltig(zu_lang);

    // ASSERT: Max 500 Zeichen erlaubt
    expect(ergebnis).toBe(false);
  });

  it('sollte true zurückgeben für Kommentar mit genau 500 Zeichen', () => {
    // ARRANGE: Grenzfall - exakt 500 Zeichen
    const genau_500 = 'A'.repeat(500);

    // ACT
    const ergebnis = istKommentarGueltig(genau_500);

    // ASSERT: Sollte noch gültig sein
    expect(ergebnis).toBe(true);
  });

  it('sollte true zurückgeben für Kommentar mit nur 1 Zeichen', () => {
    // ARRANGE: Sehr kurzer aber gültiger Kommentar
    const kurz = 'A';

    // ACT
    const ergebnis = istKommentarGueltig(kurz);

    // ASSERT: Sollte gültig sein (keine Mindestlänge bei Kommentaren)
    expect(ergebnis).toBe(true);
  });
}
);

