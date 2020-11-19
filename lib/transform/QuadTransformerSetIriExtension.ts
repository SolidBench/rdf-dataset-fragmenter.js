import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';
import { QuadTransformerTerms } from './QuadTransformerTerms';

const DF = new DataFactory();

/**
 * A quad transformer that enforces the configured extension on all named nodes.
 * The given extension should not start with `.`.
 */
export class QuadTransformerSetIriExtension extends QuadTransformerTerms {
  private readonly extension: string;

  public constructor(extension: string) {
    super();
    this.extension = extension;
  }

  protected transformTerm(term: RDF.Term): RDF.Term {
    if (term.termType === 'NamedNode') {
      let value = term.value;
      const extensionMatch = /\.[a-z]*$/iu.exec(value);
      if (extensionMatch) {
        value = value.slice(0, value.length - extensionMatch[0].length);
      }
      return DF.namedNode(`${value}.${this.extension}`);
    }
    return term;
  }
}
