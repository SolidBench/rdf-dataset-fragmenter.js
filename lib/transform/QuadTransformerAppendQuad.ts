import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import type { IQuadMatcher } from '../quadmatcher/IQuadMatcher';
import type { IQuadTransformer } from './IQuadTransformer';
import type { ITermTemplate } from './termtemplate/ITermTemplate';

const DF = new DataFactory();

/**
 * A quad transformer that appends a quad to matching quads.
 */
export class QuadTransformerAppendQuad implements IQuadTransformer {
  public constructor(
    public readonly matcher: IQuadMatcher,
    public readonly subject: ITermTemplate,
    public readonly predicate: ITermTemplate,
    public readonly object: ITermTemplate,
    public readonly graph: ITermTemplate,
  ) {}

  public transform(quad: RDF.Quad): RDF.Quad[] {
    const quads = [ quad ];

    // Append to applicable quads
    if (this.matcher.matches(quad)) {
      this.appendQuads(quad, quads);
    }

    return quads;
  }

  protected appendQuads(original: RDF.Quad, results: RDF.Quad[]): void {
    results.push(DF.quad(
      <RDF.Quad_Subject> this.subject.getTerm(original),
      <RDF.Quad_Predicate> this.predicate.getTerm(original),
      <RDF.Quad_Object> this.object.getTerm(original),
      <RDF.Quad_Graph> this.graph.getTerm(original),
    ));
  }
}
