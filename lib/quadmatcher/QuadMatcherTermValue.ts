import { hash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import type { IQuadMatcher } from './IQuadMatcher';

/**
 * Matches a quad by the given predicate regex.
 */
export class QuadMatcherTermValue implements IQuadMatcher {
  private readonly regex: RegExp;
  private readonly term: RDF.QuadTermName;
  private readonly probability: number;

  /**
   * @param quadTerm The quad term to match
   * @param valueRegex The regular expression to use when matching
   * @param probability The probability to match @range {float}
   */
  public constructor(quadTerm: RDF.QuadTermName, valueRegex: string, probability?: number) {
    this.regex = new RegExp(valueRegex, 'u');
    this.term = quadTerm;
    this.probability = probability ?? 1;
  }

  public matches(quad: RDF.Quad): boolean {
    const termValue = quad[this.term].value;
    const termMatch = this.regex.exec(termValue);
    if (termMatch) {
      const hashDigest = hash('sha256', termMatch.at(1) ?? termValue, 'hex');
      const hashValue = Number.parseInt(hashDigest, 16) / (2 ** 256);
      return hashValue <= this.probability;
    }
    return false;
  }
}
