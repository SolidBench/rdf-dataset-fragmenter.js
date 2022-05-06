import type * as RDF from '@rdfjs/types';

import { quadToStringQuad } from 'rdf-string';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A quad transformer that wraps over another quad transformer and removes duplicates.
 */
export class QuadTransformerDistinct implements IQuadTransformer {
  private readonly transformer: IQuadTransformer;
  private readonly passedQuads: Set<string>;

  public constructor(transformer: IQuadTransformer) {
    this.transformer = transformer;
    this.passedQuads = new Set();
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    return this.transformer.transform(quad)
      .filter(quadOut => {
        const hash = JSON.stringify(quadToStringQuad(quadOut));
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
