import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerDistributeIri } from '../../../lib/transform/QuadTransformerDistributeIri';

const DF = new DataFactory();

describe('QuadTransformerDistributeIri', () => {
  let transformer: IQuadTransformer;

  describe('with a replace group', () => {
    beforeEach(() => {
      transformer = new QuadTransformerDistributeIri(
        '^http://www.ldbc.eu/data/pers([0-9]*)$',
        [ 'http://server1.ldbc.eu/pods/$1/profile/card#me', 'http://server2.ldbc.eu/pods/$1/profile/card#me' ],
      );
    });

    describe('transform', () => {
      it('should modify applicable terms', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('http://www.ldbc.eu/data/pers0494'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://server1.ldbc.eu/pods/0494/profile/card#me'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('http://www.ldbc.eu/data/pers0495'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://server2.ldbc.eu/pods/0495/profile/card#me'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);
      });
    });
  });
});
