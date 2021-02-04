import { DataFactory } from 'rdf-data-factory';

import { QuadMatcherPredicate } from '../../../lib/quadmatcher/QuadMatcherPredicate';

const DF = new DataFactory();

describe('QuadMatcherPredicate', () => {
  let matcher: QuadMatcherPredicate;

  beforeEach(() => {
    matcher = new QuadMatcherPredicate('vocabulary/hasInterest$');
  });

  describe('matches', () => {
    it('should return true on applicable quad', async() => {
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://example.org/vocabulary/hasInterest'),
        DF.literal('o'),
      ))).toBeTruthy();
    });

    it('should return false on non-applicable quads', async() => {
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://example.org/vocabulary/hasInterestA'),
        DF.literal('o'),
      ))).toBeFalsy();
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://example.org/vocabulary/hasBla'),
        DF.literal('o'),
      ))).toBeFalsy();
    });
  });
});
