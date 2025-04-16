import { randomBytes } from 'node:crypto';
import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherTermValue } from '../../../lib/quadmatcher/QuadMatcherTermValue';

const DF = new DataFactory();

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

    it.each([ 0.2, 0.5, 0.8 ])('handles probability of %p', (probability: number) => {
      const matcher = new QuadMatcherTermValue({
        term: 'subject',
        regex: '^ex:s',
        probability,
      });
      const sample = 20_000;
      let matched = 0;
      for (let i = 0; i < sample; i++) {
        const quad = DF.quad(DF.namedNode(`ex:s${randomBytes(16).toString('hex')}`), quad1.predicate, quad1.object);
        const matches1 = matcher.matches(quad);
        const matches2 = matcher.matches(quad);
        expect(matches1).toBe(matches2);
        if (matches1) {
          matched++;
        }
      }
      expect(matched / sample).toBeCloseTo(probability, 1);
    });
  });
});
