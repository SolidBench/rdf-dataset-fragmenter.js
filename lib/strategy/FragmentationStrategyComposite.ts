import type { Readable } from 'stream';
import { PassThrough } from 'stream';
import type * as RDF from 'rdf-js';
import type { IQuadSink } from '../io/IQuadSink';
import type { IFragmentationStrategy } from './IFragmentationStrategy';

/**
 * A fragmentation strategy that combines multiple strategies.
 * This means that all the given strategies will be executed in parallel.
 */
export class FragmentationStrategyComposite implements IFragmentationStrategy {
  private readonly strategies: IFragmentationStrategy[];

  public constructor(strategies: IFragmentationStrategy[]) {
    this.strategies = strategies;
  }

  public async fragment(quadStream: RDF.Stream & Readable, quadSink: IQuadSink): Promise<void> {
    await Promise.all(this.strategies.map(strategy => {
      const clone = new PassThrough({ objectMode: true });
      const ret = strategy.fragment(clone, quadSink);
      quadStream.on('error', error => clone.emit('error', error));
      quadStream.pipe(clone);
      return ret;
    }));
  }
}
