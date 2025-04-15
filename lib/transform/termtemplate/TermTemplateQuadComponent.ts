import type * as RDF from '@rdfjs/types';
import type { QuadTermName } from 'rdf-terms';
import type { ITermTemplate } from './ITermTemplate';

/**
 * A term template that returns a given quad's component.
 */
export class TermTemplateQuadComponent implements ITermTemplate {
  public constructor(
    public readonly component: QuadTermName,
  ) {}

  public getTerm(quad: RDF.Quad): RDF.Term {
    return quad[this.component];
  }
}
