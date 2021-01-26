import type { TransformCallback } from 'stream';
import { Transform } from 'stream';
import type * as RDF from 'rdf-js';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A transform stream that runs quads through an array of transformers.
 */
export class QuadTransformStream extends Transform {
  private readonly transformers: IQuadTransformer[];

  public constructor(transformers: IQuadTransformer[]) {
    super({ objectMode: true });
    this.transformers = transformers;
  }

  public runTransformers(quad: RDF.Quad): RDF.Quad[] {
    let quads = [ quad ];
    for (const transformer of this.transformers) {
      const newQuads: RDF.Quad[] = [];
      for (const quadIn of quads) {
        for (const quadOut of transformer.transform(quadIn)) {
          newQuads.push(quadOut);
        }
      }
      quads = newQuads;
    }
    return quads;
  }

  // eslint-disable-next-line no-undef
  public _transform(quad: RDF.Quad, encoding: BufferEncoding, callback: TransformCallback): void {
    for (const transformedQuad of this.runTransformers(quad)) {
      this.push(transformedQuad);
    }
    callback();
  }

  public _flush(callback: TransformCallback): void {
    for (const transformer of this.transformers) {
      if (transformer.end) {
        transformer.end();
      }
    }
    callback();
  }
}
