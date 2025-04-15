import { createHash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import type { IQuadMatcher } from './IQuadMatcher';

/**
 * Matches a quad by the given component regex, with optional probability.
 */
export class QuadMatcherTermValue implements IQuadMatcher {
  private readonly term: RDF.QuadTermName;
  private readonly regex: RegExp;
  private readonly probability: number;

  public constructor(options: IQuadMatcherTermValueOptions) {
    this.term = options.term;
    this.regex = new RegExp(options.regex, 'u');
    this.probability = options.probability;
  }

  public matches(quad: RDF.Quad): boolean {
    const termValue = quad[this.term].value;
    const termMatch = this.regex.exec(termValue);
    if (termMatch) {
      const hashDigest = createHash('sha256').update(termMatch.at(1) ?? termValue).digest('hex');
      const hashValue = Number.parseInt(hashDigest, 16) / (2 ** 256);
      return hashValue <= this.probability;
    }
    return false;
  }
}

export interface IQuadMatcherTermValueOptions {
  /**
   * The quad component to execute regex on.
   */
  term: RDF.QuadTermName;
  /**
   * The regex used on the component value.
   */
  regex: string;
  /**
   * Optional probability to register a match.
   * @range {float}
   * @default {1.0}
   */
  probability: number;
}
