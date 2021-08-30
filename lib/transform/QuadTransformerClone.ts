import type * as RDF from '@rdfjs/types';

import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A quad transformer that transforms each quad to twice the quad.
 */
export class QuadTransformerClone implements IQuadTransformer {
  public transform(quad: RDF.Quad): RDF.Quad[] {
    return [ quad, quad ];
  }
}
