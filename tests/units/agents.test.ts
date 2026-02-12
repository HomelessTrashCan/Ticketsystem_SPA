import { describe, it, expect, beforeAll } from 'vitest';

describe('agents API', () => {
  const API_URL = 'http://localhost:8080/api/agents';
  let agents: string[] = [];

  beforeAll(async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        agents = await response.json();
      }
    } catch (error) {
      console.warn('Could not fetch agents from API:', error);
    }
  });

  it('should return an array from the API', () => {
    expect(Array.isArray(agents)).toBe(true);
  });

  it('should contain at least one email', () => {
    expect(agents.length).toBeGreaterThan(0);
  });

  it('should contain valid email-like strings', () => {
    const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    expect(agents.every((a) => typeof a === 'string')).toBe(true);
    expect(agents.some((a) => emailPattern.test(a))).toBe(true);
  });

  it('should not contain duplicate emails', () => {
    const uniqueEmails = new Set(agents);
    expect(uniqueEmails.size).toBe(agents.length);
  });
});
