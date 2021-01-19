import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerReplaceIri } from '../../../lib/transform/QuadTransformerReplaceIri';

const DF = new DataFactory();

describe('QuadTransformerReplaceIri', () => {
  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerReplaceIri('^http://www.ldbc.eu', 'http://localhost:3000/www.ldbc.eu');
  });

  describe('transform', () => {
    it('should modify applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a.ttl'),
        DF.namedNode('ex:p'),
        DF.literal('o'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://localhost:3000/www.ldbc.eu/a.ttl'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ),
      ]);
    });

    it('should not modify non-applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://something.ldbc.eu/a.ttl'),
        DF.namedNode('ex:p'),
        DF.literal('o'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://something.ldbc.eu/a.ttl'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ),
      ]);
    });
  });
});
