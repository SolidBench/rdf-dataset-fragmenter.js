import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import { QuadTransformerAppendResourceAdapter } from './QuadTransformerAppendResourceAdapter';

const DF = new DataFactory();

/**
 * A quad transformer that appends a link to resources of the given type.
 */
export class QuadTransformerAppendResourceLink extends QuadTransformerAppendResourceAdapter {
  private readonly predicate: RDF.NamedNode;
  private readonly link: string;

  public constructor(
    typeRegex: string,
    predicate: string,
    link: string,
  ) {
    super(typeRegex);
    this.predicate = DF.namedNode(predicate);
    this.link = link;
  }

  protected appendQuads(original: RDF.Quad, results: RDF.Quad[]): void {
    results.push(DF.quad(original.subject, this.predicate, DF.namedNode(original.subject.value + this.link)));
  }
}
