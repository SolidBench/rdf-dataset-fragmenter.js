import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import {
  QuadTransformerAppendResourceSolidTypeIndex,
} from '../../../lib/transform/QuadTransformerAppendResourceSolidTypeIndex';

const DF = new DataFactory();

describe('QuadTransformerAppendResourceSolidTypeIndex', () => {
  let transformer: IQuadTransformer;

  describe('for an instance entry', () => {
    beforeEach(() => {
      transformer = new QuadTransformerAppendResourceSolidTypeIndex(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        '../settings/publicTypeIndex',
        '#posts',
        '../posts',
        false,
      );
    });

    describe('transform', () => {
      it('should handle applicable quads', async() => {
        // Recognise the post type
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:post'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Post'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:post'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('http://example.org/vocabulary/Post'),
          ),
        ]);

        // After also finding the creator, emit triples for the type index
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:post'),
          DF.namedNode('http://example.org/vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/0123/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:post'),
            DF.namedNode('http://example.org/vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/0123/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/profile/card#me'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_PUBLIC_TYPE_INDEX,
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_INDEX,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_LISTED_DOCUMENT,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_REGISTRATION,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_FOR_CLASS,
            DF.namedNode('http://example.org/vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_INSTANCE,
            DF.namedNode('http://example.org/pods/0123/posts'),
          ),
        ]);
      });
    });
  });

  describe('for a container entry', () => {
    beforeEach(() => {
      transformer = new QuadTransformerAppendResourceSolidTypeIndex(
        'vocabulary/Post$',
        'vocabulary/hasCreator$',
        '../settings/publicTypeIndex',
        '#posts',
        '../posts/',
        true,
      );
    });

    describe('transform', () => {
      it('should handle applicable quads', async() => {
        // Recognise the post type
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:post'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Post'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:post'),
            DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            DF.namedNode('http://example.org/vocabulary/Post'),
          ),
        ]);

        // After also finding the creator, emit triples for the type index
        expect(transformer.transform(DF.quad(
          DF.namedNode('ex:post'),
          DF.namedNode('http://example.org/vocabulary/hasCreator'),
          DF.namedNode('http://example.org/pods/0123/profile/card#me'),
        ))).toEqual([
          DF.quad(
            DF.namedNode('ex:post'),
            DF.namedNode('http://example.org/vocabulary/hasCreator'),
            DF.namedNode('http://example.org/pods/0123/profile/card#me'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/profile/card#me'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_PUBLIC_TYPE_INDEX,
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_INDEX,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_LISTED_DOCUMENT,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_A,
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_TYPE_REGISTRATION,
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_FOR_CLASS,
            DF.namedNode('http://example.org/vocabulary/Post'),
          ),
          DF.quad(
            DF.namedNode('http://example.org/pods/0123/settings/publicTypeIndex#posts'),
            QuadTransformerAppendResourceSolidTypeIndex.IRI_SOLID_INSTANCE_CONTAINER,
            DF.namedNode('http://example.org/pods/0123/posts/'),
          ),
        ]);
      });
    });
  });
});
