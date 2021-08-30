import type { Readable } from 'stream';
import { PassThrough } from 'stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import type { IQuadMatcher } from '../quadmatcher/IQuadMatcher';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';
import type { IFragmentationStrategy } from './IFragmentationStrategy';

/**
 * A fragmentation strategy that delegates all but the listed exceptions to a given strategy.
 * The exceptions are handled via matchers, that can delegate to another strategy.
 */
export class FragmentationStrategyException extends FragmentationStrategyStreamAdapter {
  private readonly strategy: IFragmentationStrategy;
  private readonly exceptions: FragmentationStrategyExceptionEntry[];

  private state: IStreamState | undefined;

  public constructor(strategy: IFragmentationStrategy, exceptions: FragmentationStrategyExceptionEntry[]) {
    super();
    this.strategy = strategy;
    this.exceptions = exceptions;
  }

  public async fragment(quadStream: RDF.Stream & Readable, quadSink: IQuadSink): Promise<void> {
    // Create streams in which we can push our quads,
    // and start fragmenting on these new streams
    // Streams are created for our base strategy, and all exceptions.
    // We also keep a pointer to the fragmenter's promise, which we will await upon flushing.
    const strategyStream = new PassThrough({ objectMode: true });
    const strategyPromise = this.strategy.fragment(strategyStream, quadSink);
    const exceptionStreams = [];
    const exceptionPromises = [];
    for (const exception of this.exceptions) {
      const stream = new PassThrough({ objectMode: true });
      exceptionStreams.push(stream);
      const exceptionPromise = exception.strategy.fragment(stream, quadSink);
      exceptionPromises.push(exceptionPromise);
    }
    this.state = {
      strategyStream,
      strategyPromise,
      exceptionStreams,
      exceptionPromises,
    };

    // Call handleQuad in a streaming manner
    await super.fragment(quadStream, quadSink);

    // Close our streams
    this.state.strategyStream.push(null);
    for (const exceptionStream of this.state.exceptionStreams) {
      exceptionStream.push(null);
    }

    // Wait on the fragmentation strategies to end
    await this.state.strategyPromise;
    await Promise.all(this.state.exceptionPromises);

    this.state = undefined;
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    if (!this.state) {
      throw new Error('Illegal state: handleQuad can only be called via fragment');
    }

    // Push the quad to the first matching exception
    for (let i = 0; i < this.exceptions.length; i++) {
      const exception = this.exceptions[i];
      if (exception.matcher.matches(quad)) {
        this.state.exceptionStreams[i].push(quad);
        return;
      }
    }

    // If not exceptions matched, push the quad to our base strategy
    this.state.strategyStream.push(quad);
  }
}

export interface IStreamState {
  strategyStream: PassThrough;
  strategyPromise: Promise<void>;
  exceptionStreams: PassThrough[];
  exceptionPromises: Promise<void>[];
}

export class FragmentationStrategyExceptionEntry {
  public readonly matcher: IQuadMatcher;
  public readonly strategy: IFragmentationStrategy;

  public constructor(matcher: IQuadMatcher, strategy: IFragmentationStrategy) {
    this.matcher = matcher;
    this.strategy = strategy;
  }
}
