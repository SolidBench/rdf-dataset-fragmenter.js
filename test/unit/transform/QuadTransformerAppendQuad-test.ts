import { DataFactory } from 'rdf-data-factory';
import { QuadMatcherPredicate } from '../../../lib/quadmatcher/QuadMatcherPredicate';
import type { IQuadTransformer } from '../../../lib/transform/IQuadTransformer';
import { QuadTransformerAppendQuad } from '../../../lib/transform/QuadTransformerAppendQuad';
import { TermTemplateQuadComponent } from '../../../lib/transform/termtemplate/TermTemplateQuadComponent';
import { TermTemplateStaticNamedNode } from '../../../lib/transform/termtemplate/TermTemplateStaticNamedNode';

const DF = new DataFactory();

describe('QuadTransformerAppendQuad', () => {
  let transformer: IQuadTransformer;

  beforeEach(() => {
    transformer = new QuadTransformerAppendQuad(
      new QuadMatcherPredicate('p1$'),
      new TermTemplateQuadComponent('object'),
      new TermTemplateStaticNamedNode('ex:p2'),
      new TermTemplateQuadComponent('subject'),
      new TermTemplateQuadComponent('graph'),
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
          DF.namedNode('ex:a'),
          DF.namedNode('ex:p2'),
          DF.namedNode('http://www.ldbc.eu/a'),
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
  });
});
