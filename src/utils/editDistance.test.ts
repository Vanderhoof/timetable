import { describe, it, expect } from 'vitest';
import { editDistance, closestMatch } from './editDistance';

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(editDistance('abc', 'abc')).toBe(0);
    expect(editDistance('Иванова', 'Иванова')).toBe(0);
  });

  it('returns 0 for identical strings ignoring case', () => {
    expect(editDistance('ABC', 'abc')).toBe(0);
  });

  it('returns 1 for one deletion', () => {
    expect(editDistance('abc', 'ab')).toBe(1);
    expect(editDistance('Иванова', 'Иванов')).toBe(1);
  });

  it('returns 1 for one insertion', () => {
    expect(editDistance('ab', 'abc')).toBe(1);
  });

  it('returns 1 for one substitution', () => {
    expect(editDistance('abc', 'aXc')).toBe(1);
  });

  it('returns correct distance for typical teacher name typo', () => {
    // "Иванова Т.С." vs "Иванова Т.П." — one substitution
    expect(editDistance('Иванова Т.С.', 'Иванова Т.П.')).toBe(1);
  });

  it('returns correct distance for married name change (suffix)', () => {
    // "Иванова" → "Петрова" — more than 2
    expect(editDistance('Иванова', 'Петрова')).toBeGreaterThan(2);
  });

  it('handles empty strings', () => {
    expect(editDistance('', '')).toBe(0);
    expect(editDistance('abc', '')).toBe(3);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('returns correct distance for room shortName typo', () => {
    // "-114-" vs "-115-" — one substitution
    expect(editDistance('-114-', '-115-')).toBe(1);
  });
});

describe('closestMatch', () => {
  const teachers = ['Иванова Т.С.', 'Петрова А.П.', 'Козлов И.И.'];

  it('returns null for exact match (no suggestion needed)', () => {
    expect(closestMatch('Иванова Т.С.', teachers, 2)).toBeNull();
  });

  it('returns closest match within threshold', () => {
    // "Иванова Т.П." is 1 edit from "Иванова Т.С."
    expect(closestMatch('Иванова Т.П.', teachers, 2)).toBe('Иванова Т.С.');
  });

  it('returns null when no match within threshold', () => {
    // "Зайцева О.Р." is far from all entries (dist > 2 to all)
    expect(closestMatch('Зайцева О.Р.', teachers, 2)).toBeNull();
    // "Козлова В.В." — dist to "Козлов И.И." is 3 (del 'а' + 2 substitutions) — outside threshold 2
    expect(closestMatch('Козлова В.В.', teachers, 2)).toBeNull();
  });

  it('returns null for empty haystack', () => {
    expect(closestMatch('Иванова', [], 2)).toBeNull();
  });

  it('returns closest when multiple candidates within threshold', () => {
    const names = ['Иванова Т.С.', 'Иванова Т.П.'];
    // "Иванова Т.А." — dist 1 from both; should pick the first one found within threshold
    const result = closestMatch('Иванова Т.А.', names, 2);
    expect(result).toBe('Иванова Т.С.'); // first encountered
  });

  it('works for room shortNames with threshold 1', () => {
    const rooms = ['-114-', '-115-', '-228-'];
    expect(closestMatch('-114-', rooms, 1)).toBeNull(); // exact match
    expect(closestMatch('-113-', rooms, 1)).toBe('-114-'); // dist 1
    expect(closestMatch('-999-', rooms, 1)).toBeNull(); // no close match
  });
});
