import { createHash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import { termToString } from 'rdf-string';
import { DF, DatasetSummary, type IDatasetSummaryOutput, type IDatasetSummaryArgs } from './DatasetSummary';

export class DatasetSummaryVoID extends DatasetSummary {
  // Entire dataset-related data
  protected totalQuads: number;
  protected readonly distinctSubjects: Set<string>;
  protected readonly distinctObjects: Set<string>;
  protected readonly vocabularies: Set<string>;

  // Property partition-related data
  protected readonly totalQuadsByPredicate: Map<string, number>;
  protected readonly distinctSubjectsByPredicate: Map<string, Set<string>>;
  protected readonly distinctObjectsByPredicate: Map<string, Set<string>>;

  // Class partition-related data
  protected readonly entitiesByClass: Map<string, Set<string>>;

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
  public static readonly VOID_VOCABULARY = DF.namedNode(`${DatasetSummaryVoID.VOID_PREFIX}vocabulary`);

  private static readonly DATASET_REGEX = new RegExp(/#?(\w+)$/u, 'u');

  public constructor(args: IDatasetSummaryArgs) {
    super(args);
    this.totalQuads = 0;
    this.distinctSubjects = new Set();
    this.distinctObjects = new Set();
    this.vocabularies = new Set();
    this.totalQuadsByPredicate = new Map();
    this.distinctSubjectsByPredicate = new Map();
    this.distinctObjectsByPredicate = new Map();
    this.entitiesByClass = new Map();
  }

  public register(quad: RDF.Quad): void {
    this.totalQuads++;
    if (quad.subject.termType === 'NamedNode' || quad.subject.termType === 'BlankNode') {
      const subjectString = termToString(quad.subject);
      this.distinctSubjects.add(subjectString);
      if (quad.predicate.termType === 'NamedNode') {
        let predicateSubjects = this.distinctSubjectsByPredicate.get(quad.predicate.value);
        if (!predicateSubjects) {
          predicateSubjects = new Set();
          this.distinctSubjectsByPredicate.set(quad.predicate.value, predicateSubjects);
        }
        predicateSubjects.add(subjectString);
        if (
          quad.predicate.value === DatasetSummaryVoID.RDF_TYPE.value &&
          quad.object.termType === 'NamedNode'
        ) {
          let entitiesByClass = this.entitiesByClass.get(quad.object.value);
          if (!entitiesByClass) {
            entitiesByClass = new Set();
            this.entitiesByClass.set(quad.object.value, entitiesByClass);
          }
          entitiesByClass.add(subjectString);
          this.vocabularies.add(this.vocabularyFromIri(quad.object.value));
        }
      }
    }
    if (
      quad.object.termType === 'NamedNode' ||
      quad.object.termType === 'BlankNode' ||
      quad.object.termType === 'Literal'
    ) {
      const objectString = termToString(quad.object);
      this.distinctObjects.add(objectString);
      if (quad.predicate.termType === 'NamedNode') {
        let predicateObjects = this.distinctObjectsByPredicate.get(quad.predicate.value);
        if (!predicateObjects) {
          predicateObjects = new Set();
          this.distinctObjectsByPredicate.set(quad.predicate.value, predicateObjects);
        }
        predicateObjects.add(objectString);
      }
    }
    if (quad.predicate.termType === 'NamedNode') {
      this.totalQuadsByPredicate.set(
        quad.predicate.value,
        (this.totalQuadsByPredicate.get(quad.predicate.value) ?? 0) + 1,
      );
      this.vocabularies.add(this.vocabularyFromIri(quad.predicate.value));
    }
  }

  public serialize(): IDatasetSummaryOutput {
    const output: RDF.Quad[] = [];
    if (this.totalQuads > 0) {
      const datasetIri = DF.namedNode(this.dataset);
      output.push(
        DF.quad(datasetIri, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_URISPACE, DF.literal(this.dataset)),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_CLASSES, DF.literal(
          this.entitiesByClass.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_TRIPLES, DF.literal(
          this.totalQuads.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_PROPERTIES, DF.literal(
          this.totalQuadsByPredicate.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
          this.distinctSubjects.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryVoID.VOID_DISTINCT_OBJECTS, DF.literal(
          this.distinctObjects.size.toString(10),
          DatasetSummaryVoID.XSD_INTEGER,
        )),
      );
      for (const vocabulary of this.vocabularies) {
        output.push(DF.quad(datasetIri, DatasetSummaryVoID.VOID_VOCABULARY, DF.namedNode(vocabulary)));
      }
      for (const [ predicate, count ] of this.totalQuadsByPredicate) {
        const partitionIri = DF.namedNode(`${this.dataset}#${this.hashString(predicate)}`);
        output.push(
          DF.quad(datasetIri, DatasetSummaryVoID.VOID_PROPERTY_PARTITION, partitionIri),
          DF.quad(partitionIri, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
          DF.quad(partitionIri, DatasetSummaryVoID.VOID_PROPERTY, DF.namedNode(predicate)),
          DF.quad(partitionIri, DatasetSummaryVoID.VOID_TRIPLES, DF.literal(
            count.toString(10),
            DatasetSummaryVoID.XSD_INTEGER,
          )),
        );
        const distinctSubjectsForPredicate = this.distinctSubjectsByPredicate.get(predicate);
        if (distinctSubjectsForPredicate) {
          output.push(DF.quad(partitionIri, DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
            distinctSubjectsForPredicate.size.toString(10),
            DatasetSummaryVoID.XSD_INTEGER,
          )));
        }
        const distinctObjectsForPredicate = this.distinctObjectsByPredicate.get(predicate);
        if (distinctObjectsForPredicate) {
          output.push(DF.quad(partitionIri, DatasetSummaryVoID.VOID_DISTINCT_OBJECTS, DF.literal(
            distinctObjectsForPredicate.size.toString(10),
            DatasetSummaryVoID.XSD_INTEGER,
          )));
        }
      }
      for (const [ rdfclass, entities ] of this.entitiesByClass) {
        const partitionIri = DF.namedNode(`${this.dataset}#${this.hashString(rdfclass)}`);
        output.push(
          DF.quad(datasetIri, DatasetSummaryVoID.VOID_CLASS_PARTITION, partitionIri),
          DF.quad(partitionIri, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
          DF.quad(partitionIri, DatasetSummaryVoID.VOID_CLASS, DF.namedNode(rdfclass)),
          DF.quad(partitionIri, DatasetSummaryVoID.VOID_ENTITIES, DF.literal(
            entities.size.toString(),
            DatasetSummaryVoID.XSD_INTEGER,
          )),
        );
      }
    }
    return { iri: this.dataset, quads: output };
  }

  protected hashString(value: string): string {
    return createHash('md5', { encoding: 'utf8' }).update(value).end().digest('hex');
  }

  /**
   * Takes an IRI and returns the corresponding vocabulary, as defined in
   * https://www.w3.org/TR/void/#vocabularies
   * @param iri The predicate or class IRI
   */
  protected vocabularyFromIri(iri: string): string {
    return iri.replace(DatasetSummaryVoID.DATASET_REGEX, '');
  }
}
