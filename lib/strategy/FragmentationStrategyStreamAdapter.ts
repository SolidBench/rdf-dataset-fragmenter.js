import type { Readable, TransformCallback } from 'node:stream';
import { Transform } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import type { IFragmentationStrategy } from './IFragmentationStrategy';

/**
 * An abstract implementation of a fragmentation strategy.
 */
export abstract class FragmentationStrategyStreamAdapter implements IFragmentationStrategy {
  public async fragment(quadStream: RDF.Stream & Readable, quadSink: IQuadSink): Promise<void> {
    // eslint-disable-next-line ts/no-this-alias
    const self = this;
    const transform = new Transform({
      objectMode: true,
      transform(quad: RDF.Quad, encoding: BufferEncoding, callback: TransformCallback) {
        self.handleQuad(quad, quadSink).then(() => callback(), callback);
      },
    });

    await new Promise((resolve, reject) => {
      quadStream.on('error', error => transformed.emit('error', error));
      const transformed = quadStream.pipe(transform);
      // Enter flow-mode, but not need to attach a data-listener
      transformed.resume();
      transformed.on('error', reject);
      transformed.on('end', resolve);
    });

    await this.flush(quadSink);
  }

  protected abstract handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void>;

  // eslint-disable-next-line unused-imports/no-unused-vars
  protected async flush(quadSink: IQuadSink): Promise<void> {
    // Do nothing, implementors of this class can optionally override this
  }
}
