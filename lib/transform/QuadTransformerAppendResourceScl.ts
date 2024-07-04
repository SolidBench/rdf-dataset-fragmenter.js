import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

import { QuadTransformerAppendResourceAdapter } from './QuadTransformerAppendResourceAdapter';

const DF = new DataFactory();

/**
 * A quad transformer that appends SCL policies to resources of the given type.
 */
export class QuadTransformerAppendResourceScl extends QuadTransformerAppendResourceAdapter {
  /* eslint-disable ts/naming-convention */
  public static readonly PREFIX_SCL = 'https://w3id.org/scl/vocab#';
  public static readonly IRI_SCL_APPLIES_TO = DF.namedNode(`${QuadTransformerAppendResourceScl.PREFIX_SCL}appliesTo`);
  public static readonly IRI_SCL_SCOPE = DF.namedNode(`${QuadTransformerAppendResourceScl.PREFIX_SCL}scope`);
  public static readonly IRI_SCL_TYPE = DF.namedNode(`${QuadTransformerAppendResourceScl.PREFIX_SCL}SCL`);
  /* eslint-enable ts/naming-convention */

  private readonly identifierSuffix: string;
  private readonly sclPolicy: string;

  public constructor(
    typeRegex: string,
    identifierSuffix: string,
    sclPolicy: string,
  ) {
    super(typeRegex);
    this.identifierSuffix = identifierSuffix;
    this.sclPolicy = sclPolicy;
  }

  protected appendQuads(original: RDF.Quad, results: RDF.Quad[]): void {
    const policyId = DF.namedNode(original.subject.value + this.identifierSuffix);
    results.push(
      DF.quad(policyId, QuadTransformerAppendResourceScl.IRI_SCL_APPLIES_TO, original.subject),
      DF.quad(
        policyId,
        QuadTransformerAppendResourceScl.IRI_SCL_SCOPE,
        DF.literal(this.sclPolicy, QuadTransformerAppendResourceScl.IRI_SCL_TYPE),
      ),
    );
  }
}
