import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerSetIriExtension } from '../../../lib/transform/QuadTransformerSetIriExtension';

const DF = new DataFactory();

describe('QuadTransformerSetIriExtension', () => {
  let transformer: IQuadTransformer;

  describe('without iriPattern', () => {
    beforeEach(() => {
      transformer = new QuadTransformerSetIriExtension('nq');
    });

    describe('transform', () => {
      it('should add extensions when none are available', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s.nq'),
            DF.namedNode('ex:p.nq'),
            DF.literal('o'),
          ),
        ]);
      });

      it('should override existing extensions', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s.ttl'),
          DF.namedNode('ex:p.ttl'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s.nq'),
            DF.namedNode('ex:p.nq'),
            DF.literal('o'),
          ),
        ]);
      });
    });
  });

  describe('with iriPattern', () => {
    beforeEach(() => {
      transformer = new QuadTransformerSetIriExtension('nq', '^http://dbpedia.org');
    });

    describe('transform', () => {
      it('should only handle matching iris', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s.ttl'),
          DF.namedNode('http://dbpedia.org/something.ttl'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s.ttl'),
            DF.namedNode('http://dbpedia.org/something.nq'),
            DF.literal('o'),
          ),
        ]);
      });
    });
  });
});
