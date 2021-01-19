import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { QuadTransformerTerms } from './QuadTransformerTerms';

const DF = new DataFactory();

/**
 * A quad transformer that replaces (parts of) IRIs.
 */
export class QuadTransformerReplaceIri extends QuadTransformerTerms {
  private readonly search: RegExp;
  private readonly replacement: string;

  public constructor(searchRegex: string, replacementString: string) {
    super();
    this.search = new RegExp(searchRegex, 'u');
    this.replacement = replacementString;
  }

  protected transformTerm(term: RDF.Term): RDF.Term {
    if (term.termType === 'NamedNode') {
      const value = term.value.replace(this.search, this.replacement);
      return DF.namedNode(value);
    }
    return term;
  }
}
