import type { Readable } from 'node:stream';
import type * as RDF from '@rdfjs/types';
import type { IQuadSink } from '../io/IQuadSink';

/**
 * A fragmentation strategy that fragments quads into different documents.
 */
export interface IFragmentationStrategy {
  /**
   * Fragment all quads in the given stream into different documents at the given sink.
   * @param quadStream A quad stream to fragment.
   * @param quadSink The sink into which all fragmented quads will be pushed.
   */
  fragment: (quadStream: RDF.Stream & Readable, quadSink: IQuadSink) => Promise<void>;
}
