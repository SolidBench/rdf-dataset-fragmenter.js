import type * as RDF from '@rdfjs/types';
import type { ITermTemplate } from './ITermTemplate';

/**
 * A term template that returns a given quad's component.
 */
export class TermTemplateQuadComponent implements ITermTemplate {
  private readonly term: RDF.QuadTermName;
  private readonly regex?: RegExp;
  private readonly replacement?: string;

  public constructor(component: RDF.QuadTermName, valueRegex?: string, valueReplacement?: string) {
    this.term = component;
    if (valueRegex !== undefined && valueReplacement !== undefined) {
      this.regex = new RegExp(valueRegex, 'u');
      this.replacement = valueReplacement;
    }
  }

  public getTerm(quad: RDF.Quad): RDF.Term {
    const componentTerm = quad[this.term];
    if (this.regex !== undefined && this.replacement !== undefined) {
      componentTerm.value = componentTerm.value.replace(this.regex, this.replacement);
    }
    return componentTerm;
  }
}
