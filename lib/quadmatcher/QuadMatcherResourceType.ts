import type * as RDF from '@rdfjs/types';

import type { IQuadMatcher } from './IQuadMatcher';

/**
 * A quad matcher that matches all resources of the given type.
 *
 * Blank nodes are not supported.
 *
 * WARNING: This matcher assumes that all the applicable resources
 * have `rdf:type` occurring as first triple with the resource IRI as subject.
 */
export class QuadMatcherResourceType implements IQuadMatcher {
  private readonly type: RegExp;

  public readonly matchingSubjects: Record<string, boolean>;

  public constructor(typeRegex: string) {
    this.type = new RegExp(typeRegex, 'u');

    this.matchingSubjects = {};
  }

  public matches(quad: RDF.Quad): boolean {
    // Add buffer entry on applicable resource type
    if (quad.subject.termType === 'NamedNode' &&
      quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      quad.object.termType === 'NamedNode' && this.type.exec(quad.object.value)) {
      this.matchingSubjects[quad.subject.value] = true;
      return true;
    }

    return quad.subject.termType === 'NamedNode' && quad.subject.value in this.matchingSubjects;
  }
}
