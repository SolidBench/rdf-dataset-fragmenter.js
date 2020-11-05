import type * as RDF from 'rdf-js';

/**
 * A quad sink is able to consume quads to document IRI targets.
 */
export interface IQuadSink {
  /**
   * Push a quad into the given document IRI.
   * @param iri The IRI of the document to push to.
   * @param quad An RDF quad.
   */
  push: (iri: string, quad: RDF.Quad) => Promise<void>;
  /**
   * Close any file descriptors.
   */
  close: () => Promise<void>;
}
