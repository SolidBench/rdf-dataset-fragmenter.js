import { createHash } from 'crypto';
import type * as RDF from '@rdfjs/types';
import { Bloem } from 'bloem';
import { DF, DatasetSummary, type IDatasetSummaryArgs } from './DatasetSummary';

export class DatasetSummaryBloom extends DatasetSummary {
  private readonly hashBits: number;
  private readonly hashCount: number;

  private readonly projectedProperties: Map<string, Bloem>;
  private readonly projectedResources: Map<string, Bloem>;

  public static readonly MEM_PREFIX = 'http://semweb.mmlab.be/ns/membership#';

  public static readonly MEM_CLASS_MEMBERSHIPFUNCTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}MembershipFunction`);
  public static readonly MEM_CLASS_APPROXIMATEMEMBERSHIPFUNCTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}ApproximateMembershipFunction`);
  public static readonly MEM_CLASS_BLOOMFILTER = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}BloomFilter`);

  public static readonly MEM_CLASS_HASHFUNCTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}HashFunction`);
  public static readonly MEM_CLASS_HASHFUNCTIONFNV = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}FowlerNollVo`);
  public static readonly MEM_CLASS_HASHFUNCTIONMD5 = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}MD5`);

  public static readonly MEM_CLASS_MEMBERCOLLECTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}MemberCollection`);

  public static readonly MEM_PROP_SOURCECOLLECTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}sourceCollection`);
  public static readonly MEM_PROP_MEMBERCOLLECTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}memberCollection`);
  public static readonly MEM_PROP_HASHFUNCTION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}hashFunction`);
  public static readonly MEM_PROP_BINARYREPRESENTATION = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}binaryRepresentation`);
  public static readonly MEM_PROP_BITSIZE = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}bitSize`);
  public static readonly MEM_PROP_HASHSIZE = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}hashSize`);

  // The projectedProperty exists, projectedResource does not exist in the vocabulary.
  // This generator for the Bloom filters assumes that the projectedProperty indicates which instance of rdf:Property,
  // that is is the predicate value, is represented by the filter. The filter should then be applicable for triples or
  // patterns with that same predicate value, for use in filtering rdf:Resource instances (subject and obect values).
  // Following the same line of thought, the projectedResource is used to indicate which resource IRI the filter
  // applies to, and can be used to test whether specific predicate values or other resource IRIs occur in triples
  // alongside a given resource IRI (subject or object value).
  // The filters will only consider named nodes (IRIs), and will ignore blank nodes, literals and variables.
  public static readonly MEM_PROP_PROJECTEDPROPERTY = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}projectedProperty`);
  public static readonly MEM_PROP_PROJECTEDRESOURCE = DF.namedNode(`${DatasetSummaryBloom.MEM_PREFIX}projectedResource`);

  public constructor(args: IDatasetSummaryBloomArgs) {
    super(args);
    this.hashBits = args.hashBits;
    this.hashCount = args.hashCount;
    this.projectedProperties = new Map();
    this.projectedResources = new Map();
  }

  public register(quad: RDF.Quad): void {
    const subjectValue = quad.subject.termType === 'NamedNode' ? quad.subject.value : undefined;
    const predicateValue = quad.predicate.termType === 'NamedNode' ? quad.predicate.value : undefined;
    const objectValue = quad.object.termType === 'NamedNode' ? quad.object.value : undefined;
    if (subjectValue && predicateValue) {
      this.project(this.projectedResources, subjectValue, predicateValue);
      this.project(this.projectedProperties, predicateValue, subjectValue);
    }
    if (subjectValue && objectValue) {
      this.project(this.projectedResources, subjectValue, objectValue);
      this.project(this.projectedResources, objectValue, subjectValue);
    }
    if (predicateValue && objectValue) {
      this.project(this.projectedProperties, predicateValue, objectValue);
      this.project(this.projectedResources, objectValue, predicateValue);
    }
  }

  public toQuads(): RDF.Quad[] {
    const result: RDF.Quad[] = [];
    const projections = new Map<RDF.NamedNode, Map<string, Bloem>>([
      [ DatasetSummaryBloom.MEM_PROP_PROJECTEDPROPERTY, this.projectedProperties ],
      [ DatasetSummaryBloom.MEM_PROP_PROJECTEDRESOURCE, this.projectedResources ],
    ]);
    const hashFunctionIri = this.createFragmentIri(DatasetSummaryBloom.MEM_CLASS_HASHFUNCTION.value);
    for (const [ projection, projectionMapping ] of projections) {
      for (const [ projectedValue, filter ] of projectionMapping) {
        const bitfieldBase64 = (<Buffer>(<any>filter).bitfield.toBuffer()).toString('base64');

        const collectionIri = this.createFragmentIri(
          DatasetSummaryBloom.MEM_CLASS_MEMBERCOLLECTION.value,
          projection.value,
          projectedValue,
        );

        result.push(
          DF.quad(collectionIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_MEMBERCOLLECTION),
          DF.quad(collectionIri, DatasetSummaryBloom.MEM_PROP_SOURCECOLLECTION, DF.namedNode(this.dataset)),
          DF.quad(collectionIri, projection, DF.namedNode(projectedValue)),
        );

        const filterIri = this.createFragmentIri(
          DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER.value,
          projection.value,
          projectedValue,
        );

        result.push(
          DF.quad(filterIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_MEMBERSHIPFUNCTION),
          DF.quad(filterIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_APPROXIMATEMEMBERSHIPFUNCTION),
          DF.quad(filterIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_BLOOMFILTER),
          DF.quad(filterIri, DatasetSummaryBloom.MEM_PROP_HASHFUNCTION, hashFunctionIri),
          DF.quad(filterIri, DatasetSummaryBloom.MEM_PROP_MEMBERCOLLECTION, collectionIri),
          // Filter bit size needs to be associated with the membership function
          DF.quad(filterIri, DatasetSummaryBloom.MEM_PROP_BITSIZE, DF.literal(
            this.hashBits.toString(10),
            DatasetSummaryBloom.XSD_INTEGER,
          )),
          // The binary representation is associated with the membership function as base64
          DF.quad(filterIri, DatasetSummaryBloom.MEM_PROP_BINARYREPRESENTATION, DF.literal(
            bitfieldBase64,
            DatasetSummaryBloom.XSD_BASE64,
          )),
        );
      }
    }
    // This weird-looking check is done to avoid outputting the hash function quads when there are no filters.
    return result.length > 0 ?
      [
        DF.quad(hashFunctionIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_HASHFUNCTION),
        DF.quad(hashFunctionIri, DatasetSummaryBloom.RDF_TYPE, DatasetSummaryBloom.MEM_CLASS_HASHFUNCTIONFNV),
        // Filter size is associated with the hash function
        DF.quad(hashFunctionIri, DatasetSummaryBloom.MEM_PROP_HASHSIZE, DF.literal(
          this.hashCount.toString(10),
          DatasetSummaryBloom.XSD_INTEGER,
        )),
        ...result,
      ] :
      [];
  }

  protected project(map: Map<string, Bloem>, key: string, value: string): void {
    let filter = map.get(key);
    if (!filter) {
      filter = new Bloem(this.hashBits, this.hashCount, Buffer.alloc(this.hashBits / 8));
      map.set(key, filter);
    }
    filter.add(Buffer.from(value));
  }

  protected createFragmentIri(...values: string[]): RDF.NamedNode {
    const hash = createHash('md5');
    for (const value of values) {
      hash.update(value);
    }
    return DF.namedNode(`${this.dataset}#${hash.digest('hex')}`);
  }
}

export interface IDatasetSummaryBloomArgs extends IDatasetSummaryArgs {
  hashBits: number;
  hashCount: number;
}
