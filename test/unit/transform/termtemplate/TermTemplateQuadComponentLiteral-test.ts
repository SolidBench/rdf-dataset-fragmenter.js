import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import {
  TermTemplateQuadComponentLiteral,
} from '../../../../lib/transform/termtemplate/TermTemplateQuadComponentLiteral';

const DF = new DataFactory();

describe('TermTemplateQuadComponentLiteral', () => {
  const datatype = 'ex:datatype';
  const language = 'en';
  const terms: RDF.QuadTermName[] = [ 'subject', 'predicate', 'object', 'graph' ];
  const quad = DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o'), DF.namedNode('ex:g'));

  describe.each(terms)('should produce a literal from the %s value', (component) => {
    it('without datatype of language specified', () => {
      const transformer = new TermTemplateQuadComponentLiteral({ component });
      expect(transformer.getTerm(quad)).toEqual(DF.literal(quad[component].value));
    });

    it('with datatype specified', () => {
      const transformer = new TermTemplateQuadComponentLiteral({ component, datatype });
      expect(transformer.getTerm(quad)).toEqual(DF.literal(quad[component].value, DF.namedNode(datatype)));
    });

    it('with language specified', () => {
      const transformer = new TermTemplateQuadComponentLiteral({ component, language });
      expect(transformer.getTerm(quad)).toEqual(DF.literal(quad[component].value, language));
    });

    it('with datatype and language specified', () => {
      const transformer = new TermTemplateQuadComponentLiteral({ component, datatype, language });
      expect(transformer.getTerm(quad)).toEqual(DF.literal(quad[component].value, DF.namedNode(datatype)));
    });
  });
});
