import { createHash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import { termToString } from 'rdf-string';
import { DF, DatasetSummary, type IDatasetSummaryArgs } from './DatasetSummary';

export interface IDatasetSummaryVoID

export class DatasetSummaryCollectorVoID extends DatasetSummary {
  // Entire dataset-related data
  private totalQuads: number;
  private readonly distinctSubjects: Set<string>;
  private readonly distinctObjects: Set<string>;

  // Property partition-related data
  private readonly totalQuadsByPredicate: Map<string, number>;
  private readonly distinctSubjectsByPredicate: Map<string, Set<string>>;
  private readonly distinctObjectsByPredicate: Map<string, Set<string>>;

  // Class partition-related data
  private readonly entitiesByClass: Map<string, Set<string>>;

  public static readonly VOID_PREFIX = 'http://rdfs.org/ns/void#';
  public static readonly VOID_TRIPLES = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}triples`);
  public static readonly VOID_ENTITIES = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}entities`);
  public static readonly VOID_CLASS = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}class`);
  public static readonly VOID_CLASSES = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}classes`);
  public static readonly VOID_PROPERTY = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}property`);
  public static readonly VOID_PROPERTIES = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}properties`);
  public static readonly VOID_URISPACE = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}uriSpace`);
  public static readonly VOID_DATASET = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}Dataset`);
  public static readonly VOID_DISTINCT_SUBJECTS = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}distinctSubjects`);
  public static readonly VOID_DISTINCT_OBJECTS = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}distinctObjects`);
  public static readonly VOID_PROPERTY_PARTITION = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}propertyPartition`);
  public static readonly VOID_CLASS_PARTITION = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}classPartition`);

  public constructor(args: IDatasetSummaryArgs) {
    super(args);
    this.totalQuads = 0;
    this.distinctSubjects = new Set();
    this.distinctObjects = new Set();
    this.totalQuadsByPredicate = new Map();
    this.distinctSubjectsByPredicate = new Map();
    this.distinctObjectsByPredicate = new Map();
    this.entitiesByClass = new Map();
  }

  public register(quad: RDF.Quad): void {
    if (quad.subject.termType !== 'NamedNode' && quad.subject.termType !== 'BlankNode') {
      throw new Error(`Only named and blank nodes are accepted as subject: ${termToString(quad.subject)}`);
    }
    if (quad.predicate.termType !== 'NamedNode') {
      throw new Error(`Only named nodes are accepted as predicate: ${termToString(quad.predicate)}`);
    }
    if (
      quad.object.termType !== 'BlankNode' &&
      quad.object.termType !== 'NamedNode' &&
      quad.object.termType !== 'Literal'
    ) {
      throw new Error(`Only named and blank nodes or literals are accepted as object: ${termToString(quad.object)}`);
    }
    this.totalQuads++;
    this.distinctSubjects.add(quad.subject.value);
    this.distinctObjects.add(quad.object.termType === 'Literal' ?
      quad.object.value + quad.object.language + quad.object.datatype.value :
      quad.object.value);

    let predicateSubjects = this.distinctSubjectsByPredicate.get(quad.predicate.value);
    if (!predicateSubjects) {
      predicateSubjects = new Set();
      this.distinctSubjectsByPredicate.set(quad.predicate.value, predicateSubjects);
    }
    predicateSubjects.add(quad.subject.value);

    let predicateObjects = this.distinctObjectsByPredicate.get(quad.predicate.value);
    if (!predicateObjects) {
      predicateObjects = new Set();
      this.distinctObjectsByPredicate.set(quad.predicate.value, predicateObjects);
    }
    predicateObjects.add(quad.predicate.value);

    this.totalQuadsByPredicate.set(
      quad.predicate.value,
      (this.totalQuadsByPredicate.get(quad.predicate.value) ?? 0) + 1,
    );

    if (quad.predicate.value === DatasetSummaryVoID.RDF_TYPE.value && quad.object.termType === 'NamedNode') {
      let entitiesByClass = this.entitiesByClass.get(quad.object.value);
      if (!entitiesByClass) {
        entitiesByClass = new Set();
        this.entitiesByClass.set(quad.object.value, entitiesByClass);
      }
      entitiesByClass.add(quad.subject.value);
    }
  }

  public toQuads(): RDF.Quad[] {
    const dataset = DF.namedNode(this.dataset.toString());
    const result: RDF.Quad[] = [
      DF.quad(dataset, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      DF.quad(dataset, DatasetSummaryVoID.VOID_URISPACE, DF.literal(this.dataset.toString())),
      DF.quad(dataset, DatasetSummaryVoID.VOID_CLASSES, DF.literal(
        this.entitiesByClass.size.toString(10),
        DatasetSummaryVoID.XSD_INTEGER,
      )),
      DF.quad(dataset, DatasetSummaryVoID.VOID_TRIPLES, DF.literal(
        this.totalQuads.toString(10),
        DatasetSummaryVoID.XSD_INTEGER,
      )),
      DF.quad(dataset, DatasetSummaryVoID.VOID_PROPERTIES, DF.literal(
        this.totalQuadsByPredicate.size.toString(10),
        DatasetSummaryVoID.XSD_INTEGER,
      )),
      DF.quad(dataset, DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
        this.distinctSubjects.size.toString(10),
        DatasetSummaryVoID.XSD_INTEGER,
      )),
      DF.quad(dataset, DatasetSummaryVoID.VOID_DISTINCT_OBJECTS, DF.literal(
        this.distinctSubjects.size.toString(10),
        DatasetSummaryVoID.XSD_INTEGER,
      )),
    ];
    for (const [ predicate, count ] of this.totalQuadsByPredicate) {
      const partitionUri = DF.namedNode(`${this.dataset}#${this.hashString(predicate)}`);
      result.push(
        DF.quad(dataset, DatasetSummaryVoID.VOID_PROPERTY_PARTITION, partitionUri),
        DF.quad(partitionUri, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
        DF.quad(partitionUri, DatasetSummaryVoID.VOID_PROPERTY, DF.namedNode(predicate)),
        DF.quad(partitionUri, DatasetSummaryVoID.VOID_TRIPLES, DF.literal(
          count.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
      );
      const distinctSubjectsForPredicate = this.distinctSubjectsByPredicate.get(predicate);
      if (distinctSubjectsForPredicate) {
        result.push(DF.quad(partitionUri, DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
          distinctSubjectsForPredicate.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )));
      }
      const distinctObjectsForPredicate = this.distinctObjectsByPredicate.get(predicate);
      if (distinctObjectsForPredicate) {
        result.push(DF.quad(partitionUri, DatasetSummaryVoID.VOID_DISTINCT_OBJECTS, DF.literal(
          distinctObjectsForPredicate.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )));
      }
    }
    for (const [ rdfclass, entities ] of this.entitiesByClass) {
      const partitionUri = DF.namedNode(`${this.dataset}#${this.hashString(rdfclass)}`);
      result.push(
        DF.quad(dataset, DatasetSummaryVoID.VOID_CLASS_PARTITION, partitionUri),
        DF.quad(partitionUri, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
        DF.quad(partitionUri, DatasetSummaryVoID.VOID_CLASS, DF.namedNode(rdfclass)),
        DF.quad(partitionUri, DatasetSummaryVoID.VOID_ENTITIES, DF.literal(
          entities.size.toString(),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
      );
    }
    return result;
  }

  protected hashString(value: string): string {
    return createHash('md5', { encoding: 'utf8' }).update(value).end().digest('hex');
  }
}
