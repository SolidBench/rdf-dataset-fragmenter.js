import type * as RDF from 'rdf-js';

/**
 * Returns true or false for a given quad.
 */
export interface IQuadMatcher {
  matches: (quad: RDF.Quad) => boolean;
}
