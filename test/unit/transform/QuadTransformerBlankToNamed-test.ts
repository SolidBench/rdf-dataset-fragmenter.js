import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerBlankToNamed } from '../../../lib/transform/QuadTransformerBlankToNamed';

const DF = new DataFactory();

describe('QuadTransformerBlankToNamed', () => {
  let transformer: IQuadTransformer;

  describe('with a simple search and replace', () => {
    beforeEach(() => {
      transformer = new QuadTransformerBlankToNamed('^tagclass', 'http://www.example.org/tagclass');
    });

    describe('transform', () => {
      it('should modify applicable terms', async() => {
        expect(transformer.transform(DF.quad(
          DF.blankNode('tagclass000098'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://www.example.org/tagclass000098'),
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
      transformer = new QuadTransformerBlankToNamed(
        '^http://www.ldbc.eu/data/pers([0-9]*)$',
        'http://www.ldbc.eu/pods/$1/profile/card#me',
      );
    });

    describe('transform', () => {
      it('should modify applicable terms', async() => {
        expect(transformer.transform(DF.quad(
          DF.blankNode('http://www.ldbc.eu/data/pers0495'),
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
