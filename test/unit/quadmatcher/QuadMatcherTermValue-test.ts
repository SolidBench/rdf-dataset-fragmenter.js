import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherTermValue } from '../../../lib/quadmatcher/QuadMatcherTermValue';

const DF = new DataFactory();

// Mock the murmurhash, as used in the matcher, to return deterministic values.
jest.mock<typeof import('imurmurhash')>('imurmurhash', () => {
  return jest.fn().mockImplementation((text?: string | undefined) => {
    return {
      result: () => {
        const num = Number.parseInt(text!, 10);
        return Number.isInteger(num) ? num : 1;
      },
    };
  });
});

describe('QuadMatcherTermValue', () => {
  const quad1 = DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
  const quad1a = DF.quad(DF.namedNode('ex:s1a'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
  const quad1b = DF.quad(DF.namedNode('ex:s1b'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));
  const quad2 = DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.namedNode('ex:o'));

  describe('matches', () => {
    it('handles noncapturing regex', () => {
      const matcher = new QuadMatcherTermValue({
        term: 'subject',
        regex: '^ex:s1.*$',
        probability: 1,
      });
      expect(matcher.matches(quad1)).toBeTruthy();
      expect(matcher.matches(quad1a)).toBeTruthy();
      expect(matcher.matches(quad1b)).toBeTruthy();
      expect(matcher.matches(quad2)).toBeFalsy();
    });

    it('handles capturing regex', () => {
      const matcher = new QuadMatcherTermValue({
        term: 'subject',
        regex: '^(ex:s1).*$',
        probability: 1,
      });
      expect(matcher.matches(quad1)).toBeTruthy();
      expect(matcher.matches(quad1a)).toBeTruthy();
      expect(matcher.matches(quad1b)).toBeTruthy();
      expect(matcher.matches(quad2)).toBeFalsy();
    });

    it.each([ 0, 0.2, 0.5, 0.8, 1 ])('handles probability of %f', (probability) => {
      const matcher = new QuadMatcherTermValue({
        term: 'subject',
        regex: '^ex:s([0-9]+)$',
        probability,
      });
      const maxHashValue = Number.MAX_SAFE_INTEGER >>> 0;
      for (let i = 0; i < 1; i += 0.1) {
        const quad = DF.quad(DF.namedNode(`ex:s${Math.floor(i * maxHashValue)}`), quad1.predicate, quad1.object);
        const matches1 = matcher.matches(quad);
        const matches2 = matcher.matches(quad);
        expect(matches1).toBe(matches2);
        expect(matches1).toBe(i <= probability);
      }
    });
  });
});
