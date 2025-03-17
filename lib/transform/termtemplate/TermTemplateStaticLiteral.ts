import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

const DF = new DataFactory();

/**
 * A term template that always returns a literal with the given value.
 */
export class TermTemplateStaticLiteral implements ITermTemplate {
  public readonly valueTerm: RDF.Literal;

  public constructor(
    value: string,
    dataType?: string,
    langString?: string,
  ) {
    this.valueTerm = DF.literal(value, dataType ? DF.namedNode(dataType) : langString);
  }

  public getTerm(): RDF.Term {
    return this.valueTerm;
  }
}
