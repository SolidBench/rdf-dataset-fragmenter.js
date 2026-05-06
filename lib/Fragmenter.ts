import type { Readable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from './io/IQuadSink';
import type { IQuadSource } from './io/IQuadSource';
import type { IFragmentationStrategy } from './strategy/IFragmentationStrategy';
import type { IQuadTransformer } from './transform/IQuadTransformer';
import { QuadTransformStream } from './transform/QuadTransformStream';
import type { ITransformCallback } from './transformCallback/ITransformCallback';

/**
 * Fragments quads from a given source into a given sink.
 */
export class Fragmenter {
  private readonly quadSource: IQuadSource;
  private readonly transformers?: IQuadTransformer[];
  private readonly fragmentationStrategy: IFragmentationStrategy;
  private readonly quadSink: IQuadSink;
  private readonly transformCallBack?: ITransformCallback[];

  public constructor(options: IFragmenterOptions) {
    this.quadSource = options.quadSource;
    this.transformers = options.transformers;
    this.fragmentationStrategy = options.fragmentationStrategy;
    this.quadSink = options.quadSink;
    this.transformCallBack = options.transformCallback;
  }

  public static getTransformedQuadStream(
    quadSource: IQuadSource,
    transformers: IQuadTransformer[],
    transformCallback?: ITransformCallback[],
  ): RDF.Stream & Readable {
    const quadStream = quadSource.getQuads();
    if (transformers.length > 0) {
      const transformedQuadStream = new QuadTransformStream(transformers, transformCallback);
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
    if (this.transformCallBack) {
      await Promise.all(this.transformCallBack.map(callback => callback.initializeCallback()));
    }
    await this.fragmentationStrategy.fragment(
      Fragmenter.getTransformedQuadStream(
        this.quadSource,
        this.transformers ?? [],
        this.transformCallBack,
      ),
      this.quadSink,
    );
    await this.quadSink.close();
    this.transformCallBack?.map(callback => callback.end());
  }
}

export interface IFragmenterOptions {
  quadSource: IQuadSource;
  transformers?: IQuadTransformer[];
  fragmentationStrategy: IFragmentationStrategy;
  quadSink: IQuadSink;
  transformCallback?: ITransformCallback[];
}
