import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { QuadTermName } from 'rdf-terms';
import { resolve } from 'relative-to-absolute-iri';
import type { IQuadMatcher } from '../quadmatcher/IQuadMatcher';
import type { IQuadTransformer } from './IQuadTransformer';

const DF = new DataFactory();

/**
 * A quad transformer that appends a link to matching quads.
 */
export class QuadTransformerAppendQuadLink implements IQuadTransformer {
  private static readonly RDF_TYPE = DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');

  private readonly matcher: IQuadMatcher;
  private readonly identifier: QuadTermName;
  private readonly predicate: RDF.NamedNode;
  private readonly link: string;
  private readonly linkType?: RDF.NamedNode;
  private readonly reverse?: boolean;
  private readonly linkRemoveTrailingSlash?: boolean;

  public constructor(
    matcher: IQuadMatcher,
    identifier: QuadTermName,
    predicate: string,
    link: string,
    linkType?: string,
    reverse?: boolean,
    linkRemoveTrailingSlash?: boolean,
  ) {
    this.matcher = matcher;
    this.identifier = identifier;
    this.predicate = DF.namedNode(predicate);
    this.link = link;
    this.linkType = linkType ? DF.namedNode(linkType) : undefined;
    this.reverse = reverse;
    this.linkRemoveTrailingSlash = linkRemoveTrailingSlash;
  }

  public transform(quad: RDF.Quad): RDF.Quad[] {
    const quads = [ quad ];

    // Append to applicable quads
    if (this.matcher.matches(quad)) {
      this.appendQuads(quad, quads);
    }

    return quads;
  }

  protected appendQuads(original: RDF.Quad, results: RDF.Quad[]): void {
    const newSubject = original[this.identifier];

    // Determine target IRI
    const baseIri = newSubject.value.endsWith('/') ? newSubject.value : `${newSubject.value}/`;
    let targetIri = resolve(this.link, baseIri);
    if (this.linkRemoveTrailingSlash && targetIri.endsWith('/')) {
      targetIri = targetIri.slice(0, -1);
    }
    const target = DF.namedNode(targetIri);

    // Link from resource to target
    if (this.reverse) {
      results.push(DF.quad(target, this.predicate, <any>newSubject));
    } else {
      results.push(DF.quad(<any>newSubject, this.predicate, target));
    }

    // Optionally define the type of the target
    if (this.linkType) {
      results.push(DF.quad(target, QuadTransformerAppendQuadLink.RDF_TYPE, this.linkType));
    }
  }
}
