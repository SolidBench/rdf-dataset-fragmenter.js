import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { QuadTransformerTerms } from './QuadTransformerTerms';

const DF = new DataFactory();

/**
 * A quad transformer that that replaces (parts of) IRIs,
 * deterministically distributing the replacements over a list of multiple destination IRI, based on a matched number.
 *
 * This requires at least one group-based replacement, of which the first group must match a number.
 *
 * The matched number is used to choose one of the `replacementStrings` in a deterministic way:
 *    replacementStrings[number % replacementStrings.length]
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
        if (match.length < 2) {
          throw new Error(`QuadTransformerDistributeIri error: The "searchRegex" did not contain any groups. ` +
              `QuadTransformerDistributeIri requires at least one group-based replacement, ` +
              `of which the first group must match a number.`);
        }
        const nr = Number.parseInt(match[1], 10);
        if (Number.isNaN(nr)) {
          throw new Error(`QuadTransformerDistributeIri error: The first capture group in "searchRegex"` +
              ` must always match a number, but it matched "${match[1]}" instead.`);
        }
        const value = term.value.replace(this.search, this.replacements[nr % this.replacements.length]);
        return DF.namedNode(value);
      }
    }
    return term;
  }
}
