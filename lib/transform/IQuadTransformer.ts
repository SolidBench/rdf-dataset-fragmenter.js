import type * as RDF from 'rdf-js';

/**
 * A quad transformer can transform a given quad into an array of other quads.
 */
export interface IQuadTransformer {
  /**
   * Transform the given quad into an array of quads.
   * @param quad An RDF quad.
   */
  transform: (quad: RDF.Quad) => RDF.Quad[];

  /**
   * Called once all quads have been transformed.
   */
  end?: () => void;
}
