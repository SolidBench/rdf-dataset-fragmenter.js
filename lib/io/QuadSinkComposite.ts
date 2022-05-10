import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from './IQuadSink';

/**
 * A quad sink that combines multiple quad sinks.
 */
export class QuadSinkComposite implements IQuadSink {
  private readonly sinks: IQuadSink[];

  public constructor(sinks: IQuadSink[]) {
    this.sinks = sinks;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    for (const sink of this.sinks) {
      await sink.push(iri, quad);
    }
  }

  public async close(): Promise<void> {
    for (const sink of this.sinks) {
      await sink.close();
    }
  }
}
