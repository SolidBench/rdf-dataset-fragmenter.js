import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendResourceLink } from '../../../lib/transform/QuadTransformerAppendResourceLink';

const DF = new DataFactory();

describe('QuadTransformerAppendResourceLink', () => {
  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerAppendResourceLink('vocabulary/Person$', 'ex:myp', 'posts');
  });

  describe('transform', () => {
    it('should modify applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a/posts'),
        ),
      ]);
    });

    it('should modify applicable terms when baseIRI ends with /', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a/'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a/posts'),
        ),
      ]);
    });

    it('should not modify non-applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person2'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person2'),
        ),
      ]);
    });

    it('should emit link types', async() => {
      transformer = new QuadTransformerAppendResourceLink('vocabulary/Person$', 'ex:myp', 'posts', 'ex:Type');
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a/posts'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/posts'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('ex:Type'),
        ),
      ]);
    });

    it('should handle reverse links', async() => {
      transformer = new QuadTransformerAppendResourceLink('vocabulary/Person$', 'ex:myp', 'posts', undefined, true);
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/posts'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a'),
        ),
      ]);
    });

    it('should remove trailing slashes from the target', async() => {
      transformer = new QuadTransformerAppendResourceLink(
        'vocabulary/Person$',
        'ex:myp',
        '..',
        undefined,
        undefined,
        true,
      );
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a/b'),
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode('http://example.org/vocabulary/Person'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/b'),
          DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
          DF.namedNode('http://example.org/vocabulary/Person'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/b'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a'),
        ),
      ]);
    });
  });
});
