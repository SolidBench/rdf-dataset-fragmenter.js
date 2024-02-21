import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

import type { IQuadTransformer } from './IQuadTransformer';

const DF = new DataFactory();

/**
 * An abstract quad transformer that appends something to resources of the given type.
 */
export abstract class QuadTransformerAppendResourceAdapter implements IQuadTransformer {
  private readonly type: RegExp;

  public constructor(
    typeRegex: string,
  ) {
    this.type = new RegExp(typeRegex, 'u');
  }

  protected abstract appendQuads(original: RDF.Quad, results: RDF.Quad[]): void;

  public transform(quad: RDF.Quad): RDF.Quad[] {
    const quads = [ quad ];

    // Append SCL policy to applicable resource type
    if (quad.subject.termType === 'NamedNode' &&
      quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      quad.object.termType === 'NamedNode' && this.type.test(quad.object.value)) {
      this.appendQuads(quad, quads);
    }

    return quads;
  }
}
