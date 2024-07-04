import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import {
  QuadTransformerCompositeSequential,
} from '../../../lib/transform/QuadTransformerCompositeSequential';

const DF = new DataFactory();

describe('QuadTransformerCompositeSequential', () => {
  let transformer: QuadTransformerCompositeSequential;

  describe('over two transformers', () => {
    let subTransformer1: IQuadTransformer;
    let subTransformer2: IQuadTransformer;

    beforeEach(() => {
      subTransformer1 = {
        transform: jest.fn(quad => [ quad ]),
        end: jest.fn(),
      };
      subTransformer2 = {
        transform: jest.fn(quad => [ quad ]),
        end: jest.fn(),
      };
      transformer = new QuadTransformerCompositeSequential(
        [
          subTransformer1,
          subTransformer2,
        ],
      );
    });

    describe('transform', () => {
      it('should delegate to both subtransformers', async() => {
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

        expect(subTransformer1.transform).toHaveBeenCalledTimes(1);
        expect(subTransformer1.end).not.toHaveBeenCalled();
        expect(subTransformer2.transform).toHaveBeenCalledTimes(1);
        expect(subTransformer2.end).not.toHaveBeenCalled();
      });
    });

    describe('end', () => {
      it('should end all subtransformers', async() => {
        transformer.end();
        expect(subTransformer1.end).toHaveBeenCalledTimes(1);
        expect(subTransformer2.end).toHaveBeenCalledTimes(1);
      });
    });
  });
});
