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
    // if (this.transformCallback) {
    //   for (const callback of this.transformCallback) {
    //     // eslint-disable-next-line ts/no-floating-promises
    //     callback.run(quad, quads);
    //   }
    // }
    return quads;
  }

  // eslint-disable-next-line ts/naming-convention
  public _transform(quad: RDF.Quad, encoding: BufferEncoding, callback: TransformCallback): void {
    try {
      const transformedQuads = this.runTransformers(quad);
      if (this.transformCallback) {
        const promises = this.transformCallback.map(
          cb => cb.run(quad, transformedQuads)
        );
        Promise.all(promises)
          .then(() => {
            for (const transformedQuad of transformedQuads) {
              this.push(transformedQuad);
            }
            callback(); 
          })
          .catch((error) => {
            callback(error);
          });
      } else {
        for (const transformedQuad of transformedQuads) {
          this.push(transformedQuad);
        }
        callback();
      }
    } catch (error) {
      // Catch any synchronous errors from runTransformers
      callback(error instanceof Error ? error : new Error(String(error)));
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
