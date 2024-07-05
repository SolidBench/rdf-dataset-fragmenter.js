import type { Readable } from 'node:stream';
import type * as RDF from '@rdfjs/types';

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
