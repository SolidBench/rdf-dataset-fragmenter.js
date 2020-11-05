import type { Readable } from 'stream';
import type * as RDF from 'rdf-js';

/**
 * A quad source is able to provide a stream of quads.
 */
export interface IQuadSource {
  /**
   * Load a stream of quads.
   * This can be called multiple times.
   */
  getQuads: () => RDF.Stream & Readable;
}
