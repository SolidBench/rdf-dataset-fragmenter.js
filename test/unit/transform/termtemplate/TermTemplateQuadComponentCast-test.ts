import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from '../../../../lib/transform/termtemplate/ITermTemplate';
import type { TermTemplateTermType } from '../../../../lib/transform/termtemplate/TermTemplateQuadComponentCast';
import { TermTemplateQuadComponentCast } from '../../../../lib/transform/termtemplate/TermTemplateQuadComponentCast';

const DF = new DataFactory();

describe('TermTemplateQuadComponentCast', () => {
  const quad: RDF.Quad = DF.quad(
    DF.namedNode('ex:s'),
    DF.namedNode('ex:p'),
    DF.namedNode('ex:o'),
    DF.namedNode('ex:g'),
  );

  describe('transform', () => {
    describe.each(<RDF.QuadTermName[]>[
      'subject',
      'predicate',
      'object',
      'graph',
    ])('for component %s', (component) => {
      it.each([
        [ <TermTemplateTermType>'Literal', DF.literal(quad[component].value) ],
        [ <TermTemplateTermType>'BlankNode', DF.blankNode(quad[component].value) ],
        [ <TermTemplateTermType>'NamedNode', DF.namedNode(quad[component].value) ],
        [ undefined, quad[component] ],
      ])('should return term value as %s', (type, expected) => {
        const template: ITermTemplate = new TermTemplateQuadComponentCast({
          component,
          regex: '^(.*)$',
          replacement: '$1',
          type,
        });
        expect(template.getTerm(quad)).toEqual(expected);
      });
    });

    it('should replace matching value', () => {
      const template: ITermTemplate = new TermTemplateQuadComponentCast({
        component: 'subject',
        regex: '^ex:(.+)$',
        replacement: '$1',
        type: 'Literal',
      });
      expect(template.getTerm(quad)).toEqual(DF.literal('s'));
    });

    it('should not replace non-matching value', () => {
      const template: ITermTemplate = new TermTemplateQuadComponentCast({
        component: 'subject',
        type: 'Literal',
        regex: '^ex2:(.+)$',
        replacement: '$1',
      });
      expect(template.getTerm(quad)).toEqual(DF.literal('ex:s'));
    });
  });
});
