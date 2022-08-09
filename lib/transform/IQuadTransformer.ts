import type * as RDF from '@rdfjs/types';

/**
 * A quad transformer can transform a given quad into an array of other quads.
 */
export interface IQuadTransformer {
  /**
   * Transform the given quad into an array of quads.
   * @param quad An RDF quad.
   * @param allowedComponent The quad component on which transformation is allowed.
   *                         If undefined, then all components must be considered.
   */
  transform: (quad: RDF.Quad, allowedComponent?: 'subject' | 'object') => RDF.Quad[];

  /**
   * Called once all quads have been transformed.
   */
  end?: () => void;
}
