import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { QuadTransformerTerms } from './QuadTransformerTerms';

const DF = new DataFactory();

/**
 * A quad transformer that replaces BlankNodes by NamedNodes if the node-value changes when performing
 * search/ replacement.
 */
export class QuadTransformerBlankToNamed extends QuadTransformerTerms {
  private readonly search: RegExp;
  private readonly replacement: string;

  public constructor(searchRegex: string, replacementString: string) {
    super();
    this.search = new RegExp(searchRegex, 'u');
    this.replacement = replacementString;
  }

  protected transformTerm(term: RDF.Term): RDF.Term {
    if (term.termType === 'BlankNode') {
      const value = term.value.replace(this.search, this.replacement);
      if (value !== term.value) {
        return DF.namedNode(value);
      }
    }
    return term;
  }
}
