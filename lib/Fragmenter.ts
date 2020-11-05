import type { IQuadSink } from './io/IQuadSink';
import type { IQuadSource } from './io/IQuadSource';
import type { IFragmentationStrategy } from './strategy/IFragmentationStrategy';

/**
 * Fragments quads from a given source into a given sink.
 */
export class Fragmenter {
  private readonly quadSource: IQuadSource;
  private readonly fragmentationStrategy: IFragmentationStrategy;
  private readonly quadSink: IQuadSink;

  public constructor(options: IFragmenterOptions) {
    this.quadSource = options.quadSource;
    this.fragmentationStrategy = options.fragmentationStrategy;
    this.quadSink = options.quadSink;
  }

  /**
   * Read quads from a given source, fragment it into the sink, and close the sink.
   */
  public async fragment(): Promise<void> {
    await this.fragmentationStrategy.fragment(this.quadSource.getQuads(), this.quadSink);
    await this.quadSink.close();
  }
}

export interface IFragmenterOptions {
  quadSource: IQuadSource;
  fragmentationStrategy: IFragmentationStrategy;
  quadSink: IQuadSink;
}
