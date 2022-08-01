import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

const DF = new DataFactory();

/**
 * A term template that always returns a named node with the given value.
 */
export class TermTemplateStaticNamedNode implements ITermTemplate {
  public readonly valueTerm: RDF.NamedNode;

  public constructor(
    value: string,
  ) {
    this.valueTerm = DF.namedNode(value);
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    return this.valueTerm;
  }
}
