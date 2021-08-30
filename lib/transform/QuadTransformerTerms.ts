import type * as RDF from '@rdfjs/types';
import type { QuadTermName } from 'rdf-terms';
import { mapTerms } from 'rdf-terms';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * An abstract quad transformer that transforms all terms in a quad.
 */
export abstract class QuadTransformerTerms implements IQuadTransformer {
  public transform(quad: RDF.Quad): RDF.Quad[] {
    return [ mapTerms(quad, (term, key) => this.transformTerm(term, key)) ];
  }

  protected abstract transformTerm(term: RDF.Term, key: QuadTermName): RDF.Term;
}
