import { createHash } from 'crypto';
import type * as RDF from '@rdfjs/types';
import { Bloem } from 'bloem';
import type { IDatasetSummaryCollectorArgs, IDatasetSummary } from './DatasetSummaryCollector';
import { DF, DatasetSummaryCollector } from './DatasetSummaryCollector';

export interface IDatasetSummaryBloom extends IDatasetSummary {
  readonly projectedProperties: Map<string, Bloem>;
  readonly projectedResources: Map<string, Bloem>;
}

export class DatasetSummaryCollectorBloom extends DatasetSummaryCollector<IDatasetSummaryBloom> {
  private readonly hashBits: number;
  private readonly hashCount: number;

  public static readonly MEM_PREFIX = 'http://semweb.mmlab.be/ns/membership#';

  public static readonly MEM_CLASS_MEMBERSHIPFUNCTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}MembershipFunction`);
  public static readonly MEM_CLASS_APPROXIMATEMEMBERSHIPFUNCTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}ApproximateMembershipFunction`);
  public static readonly MEM_CLASS_BLOOMFILTER = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}BloomFilter`);

  public static readonly MEM_CLASS_HASHFUNCTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}HashFunction`);
  public static readonly MEM_CLASS_HASHFUNCTIONFNV = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}FowlerNollVo`);
  public static readonly MEM_CLASS_HASHFUNCTIONMD5 = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}MD5`);

  public static readonly MEM_CLASS_MEMBERCOLLECTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}MemberCollection`);

  public static readonly MEM_PROP_SOURCECOLLECTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}sourceCollection`);
  public static readonly MEM_PROP_MEMBERCOLLECTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}memberCollection`);
  public static readonly MEM_PROP_HASHFUNCTION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}hashFunction`);
  public static readonly MEM_PROP_BINARYREPRESENTATION = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}binaryRepresentation`);
  public static readonly MEM_PROP_BITSIZE = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}bitSize`);
  public static readonly MEM_PROP_HASHSIZE = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}hashSize`);

  // The projectedProperty exists, projectedResource does not exist in the vocabulary.
  // This generator for the Bloom filters assumes that the projectedProperty indicates which instance of rdf:Property,
  // that is is the predicate value, is represented by the filter. The filter should then be applicable for triples or
  // patterns with that same predicate value, for use in filtering rdf:Resource instances (subject and obect values).
  // Following the same line of thought, the projectedResource is used to indicate which resource IRI the filter
  // applies to, and can be used to test whether specific predicate values or other resource IRIs occur in triples
  // alongside a given resource IRI (subject or object value).
  // The filters will only consider named nodes (IRIs), and will ignore blank nodes, literals and variables.
  public static readonly MEM_PROP_PROJECTEDPROPERTY = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}projectedProperty`);
  public static readonly MEM_PROP_PROJECTEDRESOURCE = DF.namedNode(`${DatasetSummaryCollectorBloom.MEM_PREFIX}projectedResource`);

  public constructor(args: IDatasetSummaryCollectorBloomArgs) {
    super(args);
    this.hashBits = args.hashBits;
    this.hashCount = args.hashCount;
  }

  public register(dataset: string, quad: RDF.Quad): void {
    const summary = this.getDatasetSummary(dataset);
    const subjectValue = quad.subject.termType === 'NamedNode' ? quad.subject.value : undefined;
    const predicateValue = quad.predicate.termType === 'NamedNode' ? quad.predicate.value : undefined;
    const objectValue = quad.object.termType === 'NamedNode' ? quad.object.value : undefined;
    if (subjectValue && predicateValue) {
      this.project(summary.projectedResources, subjectValue, predicateValue);
      this.project(summary.projectedProperties, predicateValue, subjectValue);
    }
    if (subjectValue && objectValue) {
      this.project(summary.projectedResources, subjectValue, objectValue);
      this.project(summary.projectedResources, objectValue, subjectValue);
    }
    if (predicateValue && objectValue) {
      this.project(summary.projectedProperties, predicateValue, objectValue);
      this.project(summary.projectedResources, objectValue, predicateValue);
    }
  }

  public toQuads(): Map<string, RDF.Quad[]> {
    const output = new Map<string, RDF.Quad[]>();
    for (const [ dataset, summary ] of this.summaries) {
      const summaryQuads: RDF.Quad[] = [];
      const projections = new Map<RDF.NamedNode, Map<string, Bloem>>([
        [ DatasetSummaryCollectorBloom.MEM_PROP_PROJECTEDPROPERTY, summary.projectedProperties ],
        [ DatasetSummaryCollectorBloom.MEM_PROP_PROJECTEDRESOURCE, summary.projectedResources ],
      ]);
      const hashFunctionIri = this.createFragmentIri(
        dataset,
        DatasetSummaryCollectorBloom.MEM_CLASS_HASHFUNCTION.value,
      );
      for (const [ projection, projectionMapping ] of projections) {
        for (const [ projectedValue, filter ] of projectionMapping) {
          const bitfieldBase64 = (<Buffer>(<any>filter).bitfield.toBuffer()).toString('base64');

          const collectionIri = this.createFragmentIri(
            dataset,
            DatasetSummaryCollectorBloom.MEM_CLASS_MEMBERCOLLECTION.value,
            projection.value,
            projectedValue,
          );

          summaryQuads.push(
            DF.quad(
              collectionIri,
              DatasetSummaryCollectorBloom.RDF_TYPE,
              DatasetSummaryCollectorBloom.MEM_CLASS_MEMBERCOLLECTION,
            ),
            DF.quad(
              collectionIri,
              DatasetSummaryCollectorBloom.MEM_PROP_SOURCECOLLECTION,
              DF.namedNode(dataset),
            ),
            DF.quad(
              collectionIri,
              projection,
              DF.namedNode(projectedValue),
            ),
          );

          const filterIri = this.createFragmentIri(
            dataset,
            DatasetSummaryCollectorBloom.MEM_CLASS_BLOOMFILTER.value,
            projection.value,
            projectedValue,
          );

          summaryQuads.push(
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.RDF_TYPE,
              DatasetSummaryCollectorBloom.MEM_CLASS_MEMBERSHIPFUNCTION,
            ),
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.RDF_TYPE,
              DatasetSummaryCollectorBloom.MEM_CLASS_APPROXIMATEMEMBERSHIPFUNCTION,
            ),
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.RDF_TYPE,
              DatasetSummaryCollectorBloom.MEM_CLASS_BLOOMFILTER,
            ),
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.MEM_PROP_HASHFUNCTION,
              hashFunctionIri,
            ),
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.MEM_PROP_MEMBERCOLLECTION,
              collectionIri,
            ),
            // Filter bit size needs to be associated with the membership function
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.MEM_PROP_BITSIZE,
              DF.literal(this.hashBits.toString(10), DatasetSummaryCollectorBloom.XSD_INTEGER),
            ),
            // The binary representation is associated with the membership function as base64
            DF.quad(
              filterIri,
              DatasetSummaryCollectorBloom.MEM_PROP_BINARYREPRESENTATION,
              DF.literal(bitfieldBase64, DatasetSummaryCollectorBloom.XSD_BASE64),
            ),
          );
        }
      }
      // This weird-looking check is done to avoid outputting the hash function quads when there are no filters.
      if (summaryQuads.length > 0) {
        summaryQuads.push(
          DF.quad(
            hashFunctionIri,
            DatasetSummaryCollectorBloom.RDF_TYPE,
            DatasetSummaryCollectorBloom.MEM_CLASS_HASHFUNCTION,
          ),
          DF.quad(
            hashFunctionIri,
            DatasetSummaryCollectorBloom.RDF_TYPE,
            DatasetSummaryCollectorBloom.MEM_CLASS_HASHFUNCTIONFNV,
          ),
          // Filter size is associated with the hash function
          DF.quad(
            hashFunctionIri,
            DatasetSummaryCollectorBloom.MEM_PROP_HASHSIZE,
            DF.literal(this.hashCount.toString(10), DatasetSummaryCollectorBloom.XSD_INTEGER),
          ),
        );
        output.set(dataset, summaryQuads);
      }
    }
    return output;
  }

  protected project(map: Map<string, Bloem>, key: string, value: string): void {
    let filter = map.get(key);
    if (!filter) {
      filter = new Bloem(this.hashBits, this.hashCount, Buffer.alloc(this.hashBits / 8));
      map.set(key, filter);
    }
    filter.add(Buffer.from(value));
  }

  protected createFragmentIri(dataset: string, ...values: string[]): RDF.NamedNode {
    const hash = createHash('md5');
    for (const value of values) {
      hash.update(value);
    }
    return DF.namedNode(`${dataset}#${hash.digest('hex')}`);
  }

  protected getDatasetSummary(dataset: string): IDatasetSummaryBloom {
    let summary = this.summaries.get(dataset);
    if (!summary) {
      summary = {
        projectedProperties: new Map(),
        projectedResources: new Map(),
      };
      this.summaries.set(dataset, summary);
    }
    return summary;
  }
}

export interface IDatasetSummaryCollectorBloomArgs extends IDatasetSummaryCollectorArgs {
  hashBits: number;
  hashCount: number;
}
