import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from '../../../../lib/transform/termtemplate/ITermTemplate';
import type { TermTemplateTermType } from '../../../../lib/transform/termtemplate/TermTemplateQuadComponent';
import { TermTemplateQuadComponent } from '../../../../lib/transform/termtemplate/TermTemplateQuadComponent';

const DF = new DataFactory();

describe('TermTemplateQuadComponent', () => {
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
        const template: ITermTemplate = new TermTemplateQuadComponent(component, type);
        expect(template.getTerm(quad)).toEqual(expected);
      });
    });

    it('should replace matching value', () => {
      const template: ITermTemplate = new TermTemplateQuadComponent('subject', 'Literal', '^ex:(.+)$', '$1');
      expect(template.getTerm(quad)).toEqual(DF.literal('s'));
    });

    it('should not replace non-matching value', () => {
      const template: ITermTemplate = new TermTemplateQuadComponent('subject', 'Literal', '^ex2:(.+)$', '$1');
      expect(template.getTerm(quad)).toEqual(DF.literal('ex:s'));
    });
  });
});
