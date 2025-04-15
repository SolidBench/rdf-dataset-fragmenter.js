import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherPredicate } from '../../../lib/quadmatcher/QuadMatcherPredicate';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendQuadLink } from '../../../lib/transform/QuadTransformerAppendQuadLink';

const DF = new DataFactory();

describe('QuadTransformerAppendQuadLink', () => {
  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerAppendQuadLink(
      new QuadMatcherPredicate('p1$'),
      'subject',
      'ex:myp',
      'posts',
    );
  });

  describe('transform', () => {
    it('should modify applicable terms', async() => {
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:a'),
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
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/'),
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:a'),
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
        DF.namedNode('ex:p2'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:p2'),
          DF.namedNode('ex:a'),
        ),
      ]);
    });

    it('should modify applicable terms for a different identifier', async() => {
      transformer = new QuadTransformerAppendQuadLink(
        new QuadMatcherPredicate('p1$'),
        'object',
        'ex:myp',
        'posts',
      );

      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('ex:p1'),
        DF.namedNode('http://www.ldbc.eu/b'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:p1'),
          DF.namedNode('http://www.ldbc.eu/b'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/b'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/b/posts'),
        ),
      ]);
    });

    it('should emit link types', async() => {
      transformer = new QuadTransformerAppendQuadLink(
        new QuadMatcherPredicate('p1$'),
        'subject',
        'ex:myp',
        'posts',
        'ex:Type',
      );
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:a'),
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
      transformer = new QuadTransformerAppendQuadLink(
        new QuadMatcherPredicate('p1$'),
        'subject',
        'ex:myp',
        'posts',
        undefined,
        true,
      );
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a'),
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a'),
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:a'),
        ),
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/posts'),
          DF.namedNode('ex:myp'),
          DF.namedNode('http://www.ldbc.eu/a'),
        ),
      ]);
    });

    it('should remove trailing slashes from the target', async() => {
      transformer = new QuadTransformerAppendQuadLink(
        new QuadMatcherPredicate('p1$'),
        'subject',
        'ex:myp',
        '..',
        undefined,
        undefined,
        true,
      );
      expect(transformer.transform(DF.quad(
        DF.namedNode('http://www.ldbc.eu/a/b'),
        DF.namedNode('ex:p1'),
        DF.namedNode('ex:a'),
      ))).toEqual([
        DF.quad(
          DF.namedNode('http://www.ldbc.eu/a/b'),
          DF.namedNode('ex:p1'),
          DF.namedNode('ex:a'),
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
