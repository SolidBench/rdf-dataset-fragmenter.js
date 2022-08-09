import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerClone } from '../../../lib/transform/QuadTransformerClone';
import { QuadTransformerDistinct } from '../../../lib/transform/QuadTransformerDistinct';

const DF = new DataFactory();

describe('QuadTransformerDistinct', () => {
  let transformer: IQuadTransformer;

  describe('over a cloning transformer', () => {
    beforeEach(() => {
      transformer = new QuadTransformerDistinct(new QuadTransformerClone());
    });

    describe('transform', () => {
      it('does not emit duplicates', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ))).toEqual([]);
      });

      it('does not emit duplicates while taking into account allowedComponent', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'subject')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'object')).toEqual([
          DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:p'),
            DF.literal('o'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'subject')).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s'),
          DF.namedNode('ex:p'),
          DF.literal('o'),
        ), 'object')).toEqual([]);
      });
    });
  });

  describe('end', () => {
    it('calls end on the subtransformer', async() => {
      const subtransformer = {
        transform: jest.fn(),
        end: jest.fn(),
      };
      transformer = new QuadTransformerDistinct(subtransformer);
      transformer.end!();
      expect(subtransformer.end).toHaveBeenCalledTimes(1);
    });
  });
});
