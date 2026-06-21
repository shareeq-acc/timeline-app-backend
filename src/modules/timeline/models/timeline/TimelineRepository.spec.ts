import { incrementVersion } from './TimelineRepository';

describe('incrementVersion helper', () => {
    it('should increment standard semantic version strings (X.Y.Z)', () => {
        expect(incrementVersion('1.0.0')).toBe('1.1.0');
        expect(incrementVersion('1.2.3')).toBe('1.3.3');
        expect(incrementVersion('1.9.0')).toBe('1.10.0');
    });

    it('should increment minor-only semantic version strings (X.Y)', () => {
        expect(incrementVersion('1.0')).toBe('1.1');
        expect(incrementVersion('2.5')).toBe('2.6');
        expect(incrementVersion('10.9')).toBe('10.10');
    });

    it('should increment float-like strings', () => {
        expect(incrementVersion('1.0')).toBe('1.1');
        expect(incrementVersion('3')).toBe('3.1');
    });

    it('should fallback gracefully for invalid or empty versions', () => {
        expect(incrementVersion('')).toBe('1.0.1');
        expect(incrementVersion('invalid')).toBe('1.0.0');
        expect(incrementVersion(null as any)).toBe('1.0.1');
        expect(incrementVersion(undefined as any)).toBe('1.0.1');
    });
});
