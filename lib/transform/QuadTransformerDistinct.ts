import type * as RDF from '@rdfjs/types';

import { quadToStringQuad } from 'rdf-string';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A quad transformer that wraps over another quad transformer and removes duplicates produced by the transformer.
 * Only quads that are produced by the quad transformer (and are unequal to the incoming quad) will be filtered away.
 */
export class QuadTransformerDistinct implements IQuadTransformer {
  private readonly transformer: IQuadTransformer;
  private readonly passedQuads: Set<string>;

  public constructor(transformer: IQuadTransformer) {
    this.transformer = transformer;
    this.passedQuads = new Set();
  }

  public transform(quad: RDF.Quad, allowedComponent?: 'subject' | 'object'): RDF.Quad[] {
    return this.transformer.transform(quad)
      .filter((quadOut) => {
        // Always let through quads that equal the incoming quad
        if (quadOut.equals(quad)) {
          return true;
        }

        const hash = JSON.stringify({ ...quadToStringQuad(quadOut), allowedComponent });
        if (this.passedQuads.has(hash)) {
          return false;
        }
        this.passedQuads.add(hash);
        return true;
      });
  }

  public end(): void {
    if (this.transformer.end) {
      this.transformer.end();
    }
  }
}
