import { createHash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import type { IQuadMatcher } from './IQuadMatcher';

/**
 * Matches a quad by the given component regex, with optional probability.
 */
export class QuadMatcherComponentValue implements IQuadMatcher {
  private readonly component: RDF.QuadTermName;
  private readonly valueRegex: RegExp;
  private readonly probability: number;

  public constructor(options: IQuadMatcherComponentValueOptions) {
    this.component = options.component;
    this.valueRegex = new RegExp(options.valueRegex, 'u');
    this.probability = options.probability;
  }

  public matches(quad: RDF.Quad): boolean {
    const termValue = quad[this.component].value;
    const termMatch = this.valueRegex.exec(termValue);
    if (termMatch) {
      const hashDigest = createHash('sha256').update(termMatch.at(1) ?? termValue).digest('hex');
      const hashValue = Number.parseInt(hashDigest, 16) / (2 ** 256);
      return hashValue <= this.probability;
    }
    return false;
  }
}

export interface IQuadMatcherComponentValueOptions {
  /**
   * The quad component to execute regex on.
   */
  component: RDF.QuadTermName;
  /**
   * The regex used on the component value.
   */
  valueRegex: string;
  /**
   * Optional probability to register a match.
   * @range {float}
   * @default {1.0}
   */
  probability: number;
}
