import { describe, expect, it } from 'vitest';
import {
  FUNCTION_B_API_ENTRIES,
  FUNCTION_B_DOCUMENTED_SYMBOLS,
  FUNCTION_B_IMPORT_PATHS,
  FUNCTION_B_NAMESPACE_MEMBERS,
} from './function-entries-b';

const EXPECTED_EXAMPLES = new Set([
  'paging-zero',
  'paging-one-based',
  'strict-filters',
  'safe-objects',
  'canonical-hashing',
  'numbers-validation',
  'typed-errors',
]);

describe('function API reference partition B', () => {
  it('documents exactly one entry and canonical fns import for every assigned export', () => {
    const symbols = FUNCTION_B_API_ENTRIES.map(entry => entry.symbol);

    expect(symbols).toHaveLength(38);
    expect(new Set(symbols).size).toBe(symbols.length);
    expect(new Set(symbols)).toEqual(new Set(FUNCTION_B_DOCUMENTED_SYMBOLS));
    expect(Object.keys(FUNCTION_B_IMPORT_PATHS)).toEqual(expect.arrayContaining([...symbols]));
    expect(Object.values(FUNCTION_B_IMPORT_PATHS)).toEqual(
      expect.arrayContaining(symbols.map(() => '@sdcorejs/utils/fns')),
    );
  });

  it('keeps bilingual fields, actionable notes, exact member inventory, and valid examples', () => {
    for (const entry of FUNCTION_B_API_ENTRIES) {
      expect(entry.summary.en.trim(), `${entry.symbol} English summary`).not.toBe('');
      expect(entry.summary.vi.trim(), `${entry.symbol} Vietnamese summary`).not.toBe('');
      expect(entry.returns.en.trim(), `${entry.symbol} English return`).not.toBe('');
      expect(entry.returns.vi.trim(), `${entry.symbol} Vietnamese return`).not.toBe('');
      expect(entry.runtimeNotes.en.length, `${entry.symbol} English runtime notes`).toBeGreaterThan(0);
      expect(entry.runtimeNotes.vi.length, `${entry.symbol} Vietnamese runtime notes`).toBeGreaterThan(0);
      expect(entry.securityNotes.en.length, `${entry.symbol} English security notes`).toBeGreaterThan(0);
      expect(entry.securityNotes.vi.length, `${entry.symbol} Vietnamese security notes`).toBeGreaterThan(0);
      expect(entry.signature.trim(), `${entry.symbol} signature`).not.toBe('');
      expect(entry.exampleIds.every(id => EXPECTED_EXAMPLES.has(id)), `${entry.symbol} examples`).toBe(true);

      for (const member of entry.members ?? []) {
        expect(member.summary.en.trim(), `${entry.symbol}.${member.name} English summary`).not.toBe('');
        expect(member.summary.vi.trim(), `${entry.symbol}.${member.name} Vietnamese summary`).not.toBe('');
        expect(member.runtimeNotes.en.length, `${entry.symbol}.${member.name} English runtime notes`).toBeGreaterThan(0);
        expect(member.runtimeNotes.vi.length, `${entry.symbol}.${member.name} Vietnamese runtime notes`).toBeGreaterThan(0);
        expect(member.securityNotes.en.length, `${entry.symbol}.${member.name} English security notes`).toBeGreaterThan(0);
        expect(member.securityNotes.vi.length, `${entry.symbol}.${member.name} Vietnamese security notes`).toBeGreaterThan(0);
        expect(member.exampleIds.every(id => EXPECTED_EXAMPLES.has(id)), `${entry.symbol}.${member.name} examples`).toBe(true);
      }
    }

    for (const [namespace, expectedMembers] of Object.entries(FUNCTION_B_NAMESPACE_MEMBERS)) {
      const entry = FUNCTION_B_API_ENTRIES.find(candidate => candidate.symbol === namespace);
      expect(entry?.members?.map(member => member.name)).toEqual([...expectedMembers]);
    }
  });

  it('states the security and compatibility boundaries without generic filler', () => {
    const corpus = JSON.stringify(FUNCTION_B_API_ENTRIES);

    expect(corpus).toContain('page 0');
    expect(corpus).toContain('pageNumber + 1');
    expect(corpus).toContain('generic UUID');
    expect(corpus).toContain('isUuidV4');
    expect(corpus.toLowerCase()).toContain('there is no weak hashing fallback');
    expect(corpus).toContain('Non-cryptographic and collision-prone');
    expect(corpus).toContain('prototype-sensitive');
    expect(corpus).toContain('never an authentication or authorization boundary');
    expect(corpus).not.toContain('Public FilterUtilities.');
    expect(corpus).not.toContain('The value described ' + 'by the signature.');
    expect(corpus).not.toContain('\uFFFD');
  });
});
