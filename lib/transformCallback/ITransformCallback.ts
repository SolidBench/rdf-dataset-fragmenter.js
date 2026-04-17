import type * as RDF from '@rdfjs/types';

/**
 * Callback after the transform function, to do post-transform operations,
 * such as writing the original and transformed quads to file.
 */
export interface ITransformCallback {
  run: (quad: RDF.Quad, transformedQuads: RDF.Quad[]) => Promise<void>;
  initializeCallback: () => Promise<void>;
  end: () => void;
}
