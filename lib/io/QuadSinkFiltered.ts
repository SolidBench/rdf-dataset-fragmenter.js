import type * as RDF from '@rdfjs/types';
import type { IQuadMatcher } from '../quadmatcher/IQuadMatcher';
import type { IQuadSink } from './IQuadSink';

/**
 * A quad sink that wraps over another quad sink and only passes the quads through that match the given filter.
 */
export class QuadSinkFiltered implements IQuadSink {
  private readonly sink: IQuadSink;
  private readonly filter: IQuadMatcher;

  /**
   * @param sink The sink to filter on.
   * @param filter The filter to apply on quads.
   */
  public constructor(sink: IQuadSink, filter: IQuadMatcher) {
    this.sink = sink;
    this.filter = filter;
  }

  public async push(iri: string, quad: RDF.Quad): Promise<void> {
    if (this.filter.matches(quad)) {
      await this.sink.push(iri, quad);
    }
  }

  public async close(): Promise<void> {
    await this.sink.close();
  }
}
