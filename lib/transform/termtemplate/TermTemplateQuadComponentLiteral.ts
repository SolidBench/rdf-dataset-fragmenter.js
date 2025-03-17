import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

const DF = new DataFactory();

/**
 * A term template that returns the specified quad component value as literal.
 */
export class TermTemplateQuadComponentLiteral implements ITermTemplate {
  private readonly term: RDF.QuadTermName;

  public constructor(component: RDF.QuadTermName) {
    this.term = component;
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    return DF.literal(quad[this.term].value);
  }
}
