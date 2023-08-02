import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { QuadTransformerTerms } from './QuadTransformerTerms';

const DF = new DataFactory();

/**
 * A quad transformer that distributes IRIs over multiple destination
 * IRIs. It does so by interpreting the first capture group as a number
 * and using replacementStrings[number % replacementStrings.length]
 *
 */
export class QuadTransformerDistributeIri extends QuadTransformerTerms {
  private readonly search: RegExp;
  private readonly replacements: string[];

  public constructor(searchRegex: string, replacementStrings: string[]) {
    super();
    this.search = new RegExp(searchRegex, 'u');
    this.replacements = replacementStrings;
  }

  protected transformTerm(term: RDF.Term): RDF.Term {
    if (term.termType === 'NamedNode') {
      const match = this.search.exec(term.value);
      if (match) {
        const nr = Number.parseInt(match[1], 10);
        const value = term.value.replace(this.search, this.replacements[nr % this.replacements.length]);
        return DF.namedNode(value);
      }
    }
    return term;
  }
}
