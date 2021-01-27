import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendResourceScl } from '../../../lib/transform/QuadTransformerAppendResourceScl';

const DF = new DataFactory();

describe('QuadTransformerAppendResourceScl', () => {
  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerAppendResourceScl('vocabulary/Person$', '#policy-posts', 'FOLLOW...');
  });

  describe('transform', () => {
    it('should modify applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a.ttl'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a.ttl#policy-posts'),
          DF.namedNode('https://w3id.org/scl/vocab#appliesTo'),
          DF.namedNode('http://www.ldbc.eu/a.ttl'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a.ttl#policy-posts'),
          DF.namedNode('https://w3id.org/scl/vocab#scope'),
          DF.literal('FOLLOW...', DF.namedNode('https://w3id.org/scl/vocab#SCL')),
        ),
      ]);
    });

    it('should not modify non-applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person2'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a.ttl'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person2'),
        ),
      ]);
    });
  });
});
