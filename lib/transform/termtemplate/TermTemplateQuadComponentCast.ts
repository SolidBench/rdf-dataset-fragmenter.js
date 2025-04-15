import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

export type TermTemplateTermType = 'Literal' | 'BlankNode' | 'NamedNode';

const DF = new DataFactory();

/**
 * A term template that returns a given quad's component.
 */
export class TermTemplateQuadComponentCast implements ITermTemplate {
  private readonly component: RDF.QuadTermName;
  private readonly regex: RegExp;
  private readonly replacement: string;
  private readonly type?: TermTemplateTermType;

  public constructor(options: ITermTemplateQuadComponentCastOptions) {
    this.component = options.component;
    this.type = options.type;
    this.regex = new RegExp(options.regex, 'u');
    this.replacement = options.replacement;
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    const componentTerm = quad[this.component];
    const value = componentTerm.value.replace(this.regex, this.replacement);

    if (this.type) {
      switch (this.type) {
        case 'BlankNode':
          return DF.blankNode(value);
        case 'Literal':
          return DF.literal(value);
        case 'NamedNode':
          return DF.namedNode(value);
      }
    }

    return componentTerm;
  }
}

export interface ITermTemplateQuadComponentCastOptions {
  component: RDF.QuadTermName;
  regex: string;
  replacement: string;
  type?: TermTemplateTermType;
}
