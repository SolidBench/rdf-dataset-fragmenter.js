import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { IValueModifier } from './IValueModifier';

const DF = new DataFactory();

/**
 * A value modifier that applies the given regex on the value and replaces it with the first group match.
 */
export class ValueModifierRegexReplaceGroup implements IValueModifier {
  private readonly regex: RegExp;

  public constructor(regex: string) {
    this.regex = new RegExp(regex, 'u');
  }

  public apply(value: RDF.Term): RDF.Term {
    return DF.literal(value.value.replace(this.regex, '$1'));
  }
}
