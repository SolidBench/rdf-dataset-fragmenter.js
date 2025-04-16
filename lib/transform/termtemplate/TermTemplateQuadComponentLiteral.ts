import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

const DF = new DataFactory();

/**
 * A term template that returns a given quad's component.
 */
export class TermTemplateQuadComponentLiteral implements ITermTemplate {
  private readonly component: RDF.QuadTermName;
  private readonly languageOrDatatype?: string | RDF.NamedNode;

  public constructor(options: ITermTemplateQuadComponentLiteralOptions) {
    this.component = options.component;
    this.languageOrDatatype = options.datatype ? DF.namedNode(options.datatype) : options.language;
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    return DF.literal(quad[this.component].value, this.languageOrDatatype);
  }
}

export interface ITermTemplateQuadComponentLiteralOptions {
  /**
   * The quad term to retrieve the value from.
   */
  component: RDF.QuadTermName;
  /**
   * Optional data type URI.
   */
  datatype?: string;
  /**
   * Optional language string.
   */
  language?: string;
}
