import type * as RDF from '@rdfjs/types';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * Executes a collection of transformers in sequence.
 */
export class QuadTransformerCompositeSequential implements IQuadTransformer {
  private readonly transformers: IQuadTransformer[];

  public constructor(
    transformers: IQuadTransformer[],
  ) {
    this.transformers = transformers;
  }

  public transform(quad: RDF.Quad, allowedComponent?: 'subject' | 'object'): RDF.Quad[] {
    // Pipe quad through all transformers
    let quads = [ quad ];
    for (const transformer of this.transformers) {
      quads = quads.flatMap(subQuad => transformer.transform(subQuad, allowedComponent));
    }
    return quads;
  }

  public end(): void {
    // Terminate all transformers
    for (const transformer of this.transformers) {
      if (transformer.end) {
        transformer.end();
      }
    }
  }
}
