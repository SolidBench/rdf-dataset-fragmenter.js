import type { Readable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from './io/IQuadSink';
import type { IQuadSource } from './io/IQuadSource';
import type { IFragmentationStrategy } from './strategy/IFragmentationStrategy';
import type { IQuadTransformer } from './transform/IQuadTransformer';
import { QuadTransformStream } from './transform/QuadTransformStream';

/**
 * Fragments quads from a given source into a given sink.
 */
export class Fragmenter {
  private readonly quadSource: IQuadSource;
  private readonly transformers?: IQuadTransformer[];
  private readonly fragmentationStrategy: IFragmentationStrategy;
  private readonly quadSink: IQuadSink;

  public constructor(options: IFragmenterOptions) {
    this.quadSource = options.quadSource;
    this.transformers = options.transformers;
    this.fragmentationStrategy = options.fragmentationStrategy;
    this.quadSink = options.quadSink;
  }

  public static getTransformedQuadStream(
    quadSource: IQuadSource,
    transformers: IQuadTransformer[],
  ): RDF.Stream & Readable {
    const quadStream = quadSource.getQuads();
    if (transformers.length > 0) {
      const transformedQuadStream = new QuadTransformStream(transformers);
      quadStream.on('error', (error: Error) => transformedQuadStream.emit('error', error));
      quadStream.pipe(transformedQuadStream);
      return transformedQuadStream;
    }
    return quadStream;
  }

  /**
   * Read quads from a given source, fragment it into the sink, and close the sink.
   */
  public async fragment(): Promise<void> {
    await this.fragmentationStrategy.fragment(
      Fragmenter.getTransformedQuadStream(this.quadSource, this.transformers ?? []),
      this.quadSink,
    );
    await this.quadSink.close();
  }
}

export interface IFragmenterOptions {
  quadSource: IQuadSource;
  transformers?: IQuadTransformer[];
  fragmentationStrategy: IFragmentationStrategy;
  quadSink: IQuadSink;
}
