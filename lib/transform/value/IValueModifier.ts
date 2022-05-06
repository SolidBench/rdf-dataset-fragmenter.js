import type * as RDF from '@rdfjs/types';

/**
 * Modifiers an RDF term value.
 */
export interface IValueModifier {
  apply: (value: RDF.Term) => RDF.Term;
}
