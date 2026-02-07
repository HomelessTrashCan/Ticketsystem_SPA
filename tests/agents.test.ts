import { describe, it, expect } from 'vitest';
import { agents } from '../src/data/agents.js';

describe('agents data', () => {
  it('should be an array with at least one email', () => {
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);
  });

  it('should contain valid email-like strings', () => {
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    expect(agents.every((a) => typeof a === 'string')).toBe(true);
    expect(agents.some((a) => emailPattern.test(a))).toBe(true);
  });
});
