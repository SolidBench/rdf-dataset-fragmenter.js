import type { TransformCallback } from 'node:stream';
import { Transform } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { ITransformCallback } from '../transformCallback/ITransformCallback';
import type { IQuadTransformer } from './IQuadTransformer';

/**
 * A transform stream that runs quads through an array of transformers.
 */
export class QuadTransformStream extends Transform {
  private readonly transformers: IQuadTransformer[];
  private readonly transformCallback?: ITransformCallback[] | undefined;

  public constructor(transformers: IQuadTransformer[], callback?: ITransformCallback[]) {
    super({ objectMode: true });
    this.transformers = transformers;
    this.transformCallback = callback;
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

  // eslint-disable-next-line ts/naming-convention
  public _transform(quad: RDF.Quad, encoding: BufferEncoding, callback: TransformCallback): void {
    const transformedQuads = this.runTransformers(quad);
    // If we have a transformCallback, we need to gather the
    // promises run them and only indicate we're done
    // with the _transform call after they resolve
    if (this.transformCallback) {
      const promises = this.transformCallback.map(
        cb => cb.run(quad, transformedQuads),
      );
      Promise.all(promises)
        .then(() => {
          for (const transformedQuad of transformedQuads) {
            this.push(transformedQuad);
          }
          callback();
        })
        .catch((error: Error | null | undefined) => {
          const err = error instanceof Error ? error : new Error(String(error));
          callback(err);
        });
    } else {
      for (const transformedQuad of transformedQuads) {
        this.push(transformedQuad);
      }
      callback();
    }
  }

  // eslint-disable-next-line ts/naming-convention
  public _flush(callback: TransformCallback): void {
    for (const transformer of this.transformers) {
      if (transformer.end) {
        transformer.end();
      }
    }
    callback();
  }
}
