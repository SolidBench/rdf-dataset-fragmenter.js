import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadTransformer } from './IQuadTransformer';

const DF = new DataFactory();

/**
 * A quad transformer that maps BlankNodes to fragments on the subject URI,
 * based on the first subject that blank node appears with as an object.
 */
export class QuadTransformerBlankToSubjectFragment implements IQuadTransformer {
  private readonly mappings: Record<string, RDF.NamedNode>;

  public constructor() {
    this.mappings = {};
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    if (
      quad.subject.termType === 'NamedNode' &&
      quad.object.termType === 'BlankNode' &&
      this.mappings[quad.object.value] === undefined
    ) {
      const subjectBase = quad.subject.value.split('#')[0];
      const blankFragment = quad.object.value.split(':')[0];
      const target = DF.namedNode(`${subjectBase}#${blankFragment}`);
      this.mappings[quad.object.value] = target;
      return [ DF.quad(quad.subject, quad.predicate, target, quad.graph) ];
    }
    if (quad.subject.termType === 'BlankNode') {
      const target = this.mappings[quad.subject.value];
      if (target === undefined) {
        throw new Error(`Unmapped blank node: ${quad.subject.value}`);
      }
      return [ DF.quad(target, quad.predicate, quad.object, quad.graph) ];
    }
    return [ quad ];
  }
}
