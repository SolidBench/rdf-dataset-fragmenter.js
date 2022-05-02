import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerReplaceIri } from '../../../lib/transform/QuadTransformerReplaceIri';

const DF = new DataFactory();

describe('QuadTransformerReplaceIri', () => {
  let transformer: IQuadTransformer;

  describe('with a simple search and replace', () => {
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

  describe('with a replace group', () => {
    beforeEach(() => {
      transformer = new QuadTransformerReplaceIri(
        '^http://www.ldbc.eu/data/pers([0-9]*)$',
        'http://www.ldbc.eu/pods/$1/profile/card#me',
      );
    });

    describe('transform', () => {
      it('should modify applicable terms', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('http://www.ldbc.eu/data/pers0495'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://www.ldbc.eu/pods/0495/profile/card#me'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
      });
    });
  });
});
