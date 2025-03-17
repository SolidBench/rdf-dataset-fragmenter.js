import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { ITermTemplate } from './ITermTemplate';

export type TermTemplateTermType = 'Literal' | 'BlankNode' | 'NamedNode';

const DF = new DataFactory();

/**
 * A term template that returns a given quad's component.
 */
export class TermTemplateQuadComponent implements ITermTemplate {
  private readonly term: RDF.QuadTermName;
  private readonly regex?: RegExp;
  private readonly replacement?: string;
  private readonly type?: TermTemplateTermType;

  public constructor(
    component: RDF.QuadTermName,
    termType?: TermTemplateTermType,
    valueRegex?: string,
    valueReplacement?: string,
  ) {
    this.term = component;
    this.type = termType;
    this.regex = valueRegex ? new RegExp(valueRegex, 'u') : undefined;
    this.replacement = valueReplacement;
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    const componentTerm = quad[this.term];

    if (this.type !== undefined) {
      const value = this.regex !== undefined && this.replacement !== undefined && this.regex.test(componentTerm.value) ?
        componentTerm.value.replace(this.regex, this.replacement) :
        componentTerm.value;

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
