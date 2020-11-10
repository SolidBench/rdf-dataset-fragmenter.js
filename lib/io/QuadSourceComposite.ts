import type { Readable } from 'stream';
import { PassThrough } from 'stream';
import type * as RDF from 'rdf-js';
import type { IQuadSource } from './IQuadSource';

/**
 * A quad source that combines multiple quad sources.
 *
 * Concretely, this will create a concatenated stream of all the given sources streams.
 */
export class QuadSourceComposite implements IQuadSource {
  private readonly sources: IQuadSource[];

  public constructor(sources: IQuadSource[]) {
    this.sources = sources;
  }

  public getQuads(): RDF.Stream & Readable {
    const concat = new PassThrough({ objectMode: true });
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      const stream = source.getQuads();
      stream.pipe(concat, { end: i === this.sources.length - 1 });
      stream.on('error', error => concat.emit('error', error));
    }

    // Special case when we have no sources
    if (this.sources.length === 0) {
      concat.push(null);
    }

    return concat;
  }
}
