import type { Readable, TransformCallback } from 'stream';
import { Transform } from 'stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import type { IFragmentationStrategy } from './IFragmentationStrategy';

/**
 * An abstract implementation of a fragmentation strategy.
 */
export abstract class FragmentationStrategyStreamAdapter implements IFragmentationStrategy {
  public async fragment(quadStream: RDF.Stream & Readable, quadSink: IQuadSink): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias,consistent-this
    const self = this;
    const transform = new Transform({
      objectMode: true,
      // eslint-disable-next-line no-undef
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

  protected async flush(quadSink: IQuadSink): Promise<void> {
    // Do nothing, implementors of this class can optionally override this
  }
}
