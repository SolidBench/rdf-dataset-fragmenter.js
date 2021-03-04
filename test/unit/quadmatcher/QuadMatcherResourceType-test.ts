import { DataFactory } from 'rdf-data-factory';

import { QuadMatcherResourceType } from '../../../lib/quadmatcher/QuadMatcherResourceType';

const DF = new DataFactory();

describe('QuadMatcherResourceType', () => {
  let matcher: QuadMatcherResourceType;

  beforeEach(() => {
    matcher = new QuadMatcherResourceType('vocabulary/Person$');
  });

  describe('matches', () => {
    it('should return true on applicable type quad', async() => {
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toBeTruthy();
    });

    it('should return true on applicable type quad and following triples of that resource', async() => {
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('ex:p0'),
        DF.namedNode('ex:o0'),
      ))).toBeFalsy();
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toBeTruthy();
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:o1'),
      ))).toBeTruthy();
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('ex:p2'),
        DF.namedNode('ex:o2'),
      ))).toBeTruthy();
    });

    it('should return false on non-applicable quads', async() => {
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/PersonA'),
      ))).toBeFalsy();
      expect(matcher.matches(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Something'),
      ))).toBeFalsy();
    });
  });
});
