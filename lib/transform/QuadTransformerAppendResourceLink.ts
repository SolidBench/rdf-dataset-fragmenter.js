import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { resolve } from 'relative-to-absolute-iri';
import { QuadTransformerAppendResourceAdapter } from './QuadTransformerAppendResourceAdapter';

const DF = new DataFactory();

/**
 * A quad transformer that appends a link to resources of the given type.
 */
export class QuadTransformerAppendResourceLink extends QuadTransformerAppendResourceAdapter {
  // eslint-disable-next-line ts/naming-convention
  private static readonly RDF_TYPE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

  private readonly predicate: RDF.NamedNode;
  private readonly link: string;
  private readonly linkType?: RDF.NamedNode;
  private readonly reverse?: boolean;
  private readonly linkRemoveTrailingSlash?: boolean;

  public constructor(
    typeRegex: string,
    predicate: string,
    link: string,
    linkType?: string,
    reverse?: boolean,
    linkRemoveTrailingSlash?: boolean,
  ) {
    super(typeRegex);
    this.predicate = DF.namedNode(predicate);
    this.link = link;
    this.linkType = linkType ? DF.namedNode(linkType) : undefined;
    this.reverse = reverse;
    this.linkRemoveTrailingSlash = linkRemoveTrailingSlash;
  }

  protected appendQuads(original: RDF.Quad, results: RDF.Quad[]): void {
    // Determine target IRI
    const baseIri = original.subject.value.endsWith('/') ? original.subject.value : `${original.subject.value}/`;
    let targetIri = resolve(this.link, baseIri);
    if (this.linkRemoveTrailingSlash && targetIri.endsWith('/')) {
      targetIri = targetIri.slice(0, -1);
    }
    const target = DF.namedNode(targetIri);

    // Link from resource to target
    if (this.reverse) {
      results.push(DF.quad(target, this.predicate, original.subject));
    } else {
      results.push(DF.quad(original.subject, this.predicate, target));
    }

    // Optionally define the type of the target
    if (this.linkType) {
      results.push(DF.quad(target, QuadTransformerAppendResourceLink.RDF_TYPE, this.linkType));
    }
  }
}
