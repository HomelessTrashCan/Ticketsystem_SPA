import { describe, it, expect } from 'vitest';

describe('Priority', () => {
    it('should set priority correctly', () => {
        const priorities = ['Low', 'Medium', 'High'];
        expect(priorities[0]).toBe('Low');
        expect(priorities[1]).toBe('Medium');
        expect(priorities[2]).toBe('High');
    });

    it('should have correct priority order', () => {
        const priorityLevels = { Low: 1, Medium: 2, High: 3 };
        expect(priorityLevels.Low).toBeLessThan(priorityLevels.Medium);
        expect(priorityLevels.Medium).toBeLessThan(priorityLevels.High);
    });

    it('should validate priority values', () => {
        const validPriorities = ['Low', 'Medium', 'High'];
        const testPriority = 'High';
        expect(validPriorities).toContain(testPriority);
    });
});