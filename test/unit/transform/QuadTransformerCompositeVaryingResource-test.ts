import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherPredicate } from '../../../lib/quadmatcher/QuadMatcherPredicate';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendQuadLink } from '../../../lib/transform/QuadTransformerAppendQuadLink';
import {
  QuadTransformerAppendResourceSolidTypeIndex,
} from '../../../lib/transform/QuadTransformerAppendResourceSolidTypeIndex';
import { QuadTransformerCompositeSequential } from '../../../lib/transform/QuadTransformerCompositeSequential';
import {
  QuadTransformerCompositeVaryingResource,
} from '../../../lib/transform/QuadTransformerCompositeVaryingResource';
import { QuadTransformerDistinct } from '../../../lib/transform/QuadTransformerDistinct';
import { QuadTransformerRemapResourceIdentifier } from '../../../lib/transform/QuadTransformerRemapResourceIdentifier';
import { ValueModifierRegexReplaceGroup } from '../../../lib/transform/value/ValueModifierRegexReplaceGroup';

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

  describe('for two different sub-transformers', () => {
    beforeEach(() => {
      subTransformer1 = new QuadTransformerRemapResourceIdentifier(
        '../posts/',
        'vocabulary/Post$',
        'vocabulary/id$',
        'vocabulary/hasCreator$',
        undefined,
        undefined,
      );
      subTransformer2 = new QuadTransformerRemapResourceIdentifier(
        '../posts#',
        'vocabulary/Post$',
        'vocabulary/id$',
        'vocabulary/hasCreator$',
        undefined,
        undefined,
      );
      transformer = new QuadTransformerCompositeVaryingResource(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        [
          subTransformer1,
          subTransformer2,
        ],
      );
    });

    describe('transform', () => {
      it('should handle two unrelated resources', async() => {
        // Handle the first resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);

        // Handle the second resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('456'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/alice/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('456'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/alice/profile/card#me'),
          ),
        ]);
      });

      it('should handle two related resources', async() => {
        // Handle the first resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);

        // Handle the second resource
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('456'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/replyOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#def'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/alice/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('456'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('ex:vocabulary/replyOf'),
            DF.namedNode('http://example.org/pods/bob/posts#123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/alice/posts/456'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/alice/profile/card#me'),
          ),
        ]);
      });
    });
  });

  describe('for one sequential transformer with two chained resource remappers', () => {
    beforeEach(() => {
      transformer = new QuadTransformerCompositeVaryingResource(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        [
          new QuadTransformerCompositeSequential([
            new QuadTransformerRemapResourceIdentifier(
              '../posts_tmp#',
              'vocabulary/Post$',
              'vocabulary/id$',
              'vocabulary/hasCreator$',
              undefined,
              undefined,
            ),
            new QuadTransformerRemapResourceIdentifier(
              '../posts/',
              'vocabulary/Post$',
              'vocabulary/isLocatedIn$',
              'vocabulary/hasCreator$',
              new ValueModifierRegexReplaceGroup('^.*/([^/]*)$'),
              true,
            ),
          ]),
        ],
      );
    });

    describe('transform', () => {
      it('should handle a valid resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });

      it('should handle a link after the resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
          ),
        ]);
      });

      it('should handle a link during the resource before creator', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
        ]);
      });

      it('should handle a link during the resource before location', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/isLocatedIn'),
          DF.namedNode('http://dbpedia.org/resource/India'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/India#123'),
            DF.namedNode('ex:vocabulary/isLocatedIn'),
            DF.namedNode('http://dbpedia.org/resource/India'),
          ),
        ]);
      });
    });
  });

  describe('for one sequential transformer with two chained resource remappers with distinct', () => {
    const triplesTypeIndex = [
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_PUBLIC_TYPE_INDEX,
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex'),
      ),
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_INDEX,
      ),
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_LISTED_DOCUMENT,
      ),
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex#posts'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_REGISTRATION,
      ),
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex#posts'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_FOR_CLASS,
        DF.namedNode('ex:vocabulary/Post'),
      ),
      DF.quad(
        DF.namedNode('http://example.org/pods/bob/settings/publicTypeIndex#posts'),
        QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_INSTANCE_CONTAINER,
        DF.namedNode('http://example.org/pods/bob/posts/'),
      ),
    ];

    beforeEach(() => {
      transformer = new QuadTransformerCompositeVaryingResource(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        [
          new QuadTransformerCompositeSequential([
            new QuadTransformerRemapResourceIdentifier(
              '../posts/',
              'vocabulary/Post$',
              'vocabulary/id$',
              'vocabulary/hasCreator$',
              undefined,
              undefined,
            ),
            new QuadTransformerDistinct(
              new QuadTransformerAppendResourceSolidTypeIndex(
                'vocabulary/Post$',
                'vocabulary/hasCreator$',
                '../settings/publicTypeIndex',
                '#posts',
                '../posts/',
                true,
              ),
            ),
          ]),
        ],
      );
    });

    describe('transform', () => {
      it('should handle a valid resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          ...triplesTypeIndex,
        ]);
      });

      it('should handle a link after the resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          ...triplesTypeIndex,
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/123'),
          ),
        ]);
      });

      it('should handle a link during the resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          ...triplesTypeIndex,
        ]);
      });
    });
  });

  describe(`for one sequential transformer with two chained resource remappers with distinct over append link`, () => {
    beforeEach(() => {
      transformer = new QuadTransformerCompositeVaryingResource(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        [
          new QuadTransformerCompositeSequential([
            new QuadTransformerRemapResourceIdentifier(
              '../posts/',
              'vocabulary/Post$',
              'vocabulary/id$',
              'vocabulary/hasCreator$',
              undefined,
              undefined,
            ),
            new QuadTransformerDistinct(
              new QuadTransformerAppendQuadLink(
                new QuadMatcherPredicate('vocabulary/hasCreator$'),
                'object',
                'http://localhost:3000/internal/postsFragmentation',
                'http://localhost:3000/internal/FragmentationPerResource',
              ),
            ),
          ]),
        ],
      );
    });

    describe('transform', () => {
      it('should handle a valid resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
            DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
            DF.namedNode('http://localhost:3000/internal/FragmentationPerResource'),
          ),
        ]);
      });

      it('should handle a link after the resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
            DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
            DF.namedNode('http://localhost:3000/internal/FragmentationPerResource'),
          ),
        ]);

        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/123'),
          ),
        ]);
      });

      it('should handle a link during the resource', async() => {
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:vocabulary/Post'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/id'),
          DF.literal('123'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:fora#forum1'),
          DF.namedNode('ex:vocabulary/containerOf'),
          DF.namedNode('ex:s#abc'),
        ))).toEqual([]);
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:s#abc'),
          DF.namedNode('ex:vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/bob/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('ex:vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/id'),
            DF.literal('123'),
          ),
          DF.quad(
            DF.namedNode('ex:fora#forum1'),
            DF.namedNode('ex:vocabulary/containerOf'),
            DF.namedNode('http://example.org/pods/bob/posts/123'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/posts/123'),
            DF.namedNode('ex:vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/bob/profile/card#me'),
            DF.namedNode('http://localhost:3000/internal/postsFragmentation'),
            DF.namedNode('http://localhost:3000/internal/FragmentationPerResource'),
          ),
        ]);
      });
    });
  });
});
