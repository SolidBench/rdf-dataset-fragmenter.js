import type * as RDF from '@rdfjs/types';

/**
 * A term template is able to derive a term from a given quad.
 */
export interface ITermTemplate {
  /**
   * Get a term based on a given quad.
   * @param quad A quad.
   */
  getTerm: (quad: RDF.Quad) => RDF.Term;
}
