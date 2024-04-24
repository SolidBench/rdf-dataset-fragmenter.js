import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * A fragmentation strategy that delegates all quads towards a single path.
 */
export class FragmentationConstant extends FragmentationStrategyStreamAdapter {
  public readonly locationIri: string;

  /**
   * @param {string} locationIri - the iri of the resource where the quads going to be materialized
   */
  public constructor(locationIri: string) {
    super();
    this.locationIri = locationIri;
  }

  protected async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    await quadSink.push(this.locationIri, quad);
  }
}
