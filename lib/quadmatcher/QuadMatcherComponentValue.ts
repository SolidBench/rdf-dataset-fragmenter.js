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

  /**
   * @param {RDF.QuadTermName} component The quad component to execute regex on.
   * @param {string} valueRegex The regex used on the component value.
   * @param {number | undefined} probability Optional probability to register a match.
   */
  public constructor(component: RDF.QuadTermName, valueRegex: string, probability?: number) {
    this.component = component;
    this.valueRegex = new RegExp(valueRegex, 'u');
    this.probability = probability ?? 1;
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
