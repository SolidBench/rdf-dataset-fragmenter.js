import type * as RDF from 'rdf-js';

import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A quad transformer that transforms quads to themselves.
 */
export class QuadTransformerIdentity implements IQuadTransformer {
  public transform(quad: RDF.Quad): RDF.Quad[] {
    return [ quad ];
  }
}
