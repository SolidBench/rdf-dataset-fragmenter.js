import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import {
  QuadTransformerCompositeVaryingResource,
} from '../../../lib/transform/QuadTransformerCompositeVaryingResource';

const DF = new DataFactory();

describe('QuadTransformerCompositeVaryingResource', () => {
  let transformer: QuadTransformerCompositeVaryingResource;
  let subTransformer1: IQuadTransformer;
  let subTransformer2: IQuadTransformer;

  describe('for a fragment-based identifier separator', () => {
    beforeEach(() => {
      subTransformer1 = {
        transform: jest.fn(quad => [ quad ]),
        end: jest.fn(),
      };
      subTransformer2 = {
        transform: jest.fn(quad => [ quad ]),
        end: jest.fn(),
      };
      transformer = new QuadTransformerCompositeVaryingResource(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        [
          subTransformer1,
          subTransformer2,
        ],
      );
    });

    describe('end', () => {
      it('should end all subtransformers', async() => {
        transformer.end();
        expect(subTransformer1.end).toHaveBeenCalled();
        expect(subTransformer2.end).toHaveBeenCalled();
      });
    });

    describe('transform', () => {
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

        expect(subTransformer1.transform).not.toHaveBeenCalled();
        expect(subTransformer1.end).not.toHaveBeenCalled();
        expect(subTransformer2.transform).not.toHaveBeenCalled();
        expect(subTransformer2.end).not.toHaveBeenCalled();
      });

      describe('processing of a full resource', () => {
        it('without other props before resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': subTransformer1,
          });

          expect(subTransformer1.transform).toHaveBeenCalledTimes(3);
          expect(subTransformer1.end).not.toHaveBeenCalled();
          expect(subTransformer2.transform).not.toHaveBeenCalled();
          expect(subTransformer2.end).not.toHaveBeenCalled();
        });

        it('with other props before resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/something'),
            DF.namedNode('ex:c'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/something'),
              DF.namedNode('ex:c'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': subTransformer1,
          });

          expect(subTransformer1.transform).toHaveBeenCalledTimes(4);
          expect(subTransformer1.end).not.toHaveBeenCalled();
          expect(subTransformer2.transform).not.toHaveBeenCalled();
          expect(subTransformer2.end).not.toHaveBeenCalled();
        });

        it('with other props after resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/something'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/something'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': subTransformer1,
          });

          expect(subTransformer1.transform).toHaveBeenCalledTimes(4);
          expect(subTransformer1.end).not.toHaveBeenCalled();
          expect(subTransformer2.transform).not.toHaveBeenCalled();
          expect(subTransformer2.end).not.toHaveBeenCalled();
        });
      });

      describe('processing of two resources', () => {
        it('without other props before resource complete', async() => {
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:s'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:s'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c'),
            ),
          ]);

          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:t'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:t'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ))).toEqual([]);
          expect(transformer.transform(DF.quad(
            DF.namedNode('ex:t'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('ex:c3'),
          ))).toEqual([
            DF.quad(
              DF.namedNode('ex:t'),
              DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
              DF.namedNode('ex:vocabulary/Post'),
            ),
            DF.quad(
              DF.namedNode('ex:t'),
              DF.namedNode('ex:vocabulary/id'),
              DF.literal('123'),
            ),
            DF.quad(
              DF.namedNode('ex:t'),
              DF.namedNode('ex:vocabulary/hasCreator'),
              DF.namedNode('ex:c3'),
            ),
          ]);

          expect(transformer.resourceIdentifier.buffer).toEqual({});
          expect(transformer.resourceIdentifier.resourceMapping).toEqual({
            'ex:s': subTransformer1,
            'ex:t': subTransformer2,
          });

          expect(subTransformer1.transform).toHaveBeenCalledTimes(3);
          expect(subTransformer1.end).not.toHaveBeenCalled();
          expect(subTransformer2.transform).toHaveBeenCalledTimes(3);
          expect(subTransformer2.end).not.toHaveBeenCalled();
        });
      });
    });
  });
});
