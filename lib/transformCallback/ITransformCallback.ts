import type * as RDF from '@rdfjs/types';

export interface ITransformCallback {
  run: (quad: RDF.Quad, transformedQuads: RDF.Quad[]) => Promise<void>;
  initializeCallback: () => Promise<void>;
  end: () => void;
}
