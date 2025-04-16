import type * as RDF from '@rdfjs/types';
import * as MurmurHash3 from 'imurmurhash';
import type { IQuadMatcher } from './IQuadMatcher';

// MurmurHash3 produces 32-bit (unsigned, according to the docs) integer values
const MURMURHASH3_MAX_VALUE = Number.MAX_SAFE_INTEGER >>> 0;

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
      const hashValue = MurmurHash3(termMatch.at(1) ?? termValue).result();
      const hashValueRelativeToMax = hashValue / MURMURHASH3_MAX_VALUE;
      return hashValueRelativeToMax <= this.probability;
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
