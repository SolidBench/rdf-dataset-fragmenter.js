import type * as RDF from '@rdfjs/types';
import type { IQuadMatcher } from './IQuadMatcher';

/**
 * Matches a quad by the given predicate regex.
 */
export class QuadMatcherPredicate implements IQuadMatcher {
  private readonly predicate: RegExp;

  public constructor(predicateRegex: string) {
    this.predicate = new RegExp(predicateRegex, 'u');
  }

  public matches(quad: RDF.Quad): boolean {
    return Boolean(this.predicate.test(quad.predicate.value));
  }
}
