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
  private readonly matchFullResource: boolean;

  public readonly matchingSubjects: Record<string, boolean>;

  /**
   * @param typeRegex Regular expression for type IRIs that need to be matched.
   * @param matchFullResource If not only the quad containing the type must be matched,
   *                          but also all other quads sharing the same subject of that quad.
   */
  public constructor(typeRegex: string, matchFullResource: boolean) {
    this.type = new RegExp(typeRegex, 'u');
    this.matchFullResource = matchFullResource;

    this.matchingSubjects = {};
  }

  public matches(quad: RDF.Quad): boolean {
    // Add buffer entry on applicable resource type
    if (quad.subject.termType === 'NamedNode' &&
      quad.predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
      quad.object.termType === 'NamedNode' && this.type.test(quad.object.value)) {
      if (this.matchFullResource) {
        this.matchingSubjects[quad.subject.value] = true;
      }
      return true;
    }

    return this.matchFullResource &&
      quad.subject.termType === 'NamedNode' && quad.subject.value in this.matchingSubjects;
  }
}
