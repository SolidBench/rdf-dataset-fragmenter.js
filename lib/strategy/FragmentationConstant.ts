import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';
import { FragmentationStrategyStreamAdapter } from './FragmentationStrategyStreamAdapter';

/**
 * A fragmentation strategy that delegates all quads towards a single path.
 */
export class FragmentationConstant extends FragmentationStrategyStreamAdapter {
  public readonly path: string;

  /**
   * @param {string} path - the iri of the resource where the quads going to be materialized
   */
  public constructor(path: string) {
    super();
    this.path = path;
  }

  public async handleQuad(quad: RDF.Quad, quadSink: IQuadSink): Promise<void> {
    await quadSink.push(this.path, quad);
  }
}
