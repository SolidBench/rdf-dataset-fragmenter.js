import { createHash } from 'node:crypto';
import type * as RDF from '@rdfjs/types';
import { termToString } from 'rdf-string';
import type { IQuadSink } from '../io/IQuadSink';
import { DF, DatasetSummaryCollector, type IDatasetSummary } from './DatasetSummaryCollector';

export interface IDatasetSummaryVoID extends IDatasetSummary {
  // Entire dataset-related data
  totalQuads: number;
  readonly distinctSubjects: Set<string>;
  readonly distinctObjects: Set<string>;
  readonly vocabularies: Set<string>;

  // Property partition-related data
  readonly totalQuadsByPredicate: Map<string, number>;
  readonly distinctSubjectsByPredicate: Map<string, Set<string>>;
  readonly distinctObjectsByPredicate: Map<string, Set<string>>;

  // Class partition-related data
  readonly entitiesByClass: Map<string, Set<string>>;
}

export class DatasetSummaryCollectorVoID extends DatasetSummaryCollector<IDatasetSummaryVoID> {
  public static readonly VOID_PREFIX = 'http://rdfs.org/ns/void#';
  public static readonly VOID_TRIPLES = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}triples`);
  public static readonly VOID_ENTITIES = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}entities`);
  public static readonly VOID_CLASS = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}class`);
  public static readonly VOID_CLASSES = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}classes`);
  public static readonly VOID_PROPERTY = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}property`);
  public static readonly VOID_PROPERTIES = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}properties`);
  public static readonly VOID_URISPACE = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}uriSpace`);
  public static readonly VOID_DATASET = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}Dataset`);
  public static readonly VOID_DISTINCT_SUBJECTS = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}distinctSubjects`);
  public static readonly VOID_DISTINCT_OBJECTS = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}distinctObjects`);
  public static readonly VOID_PROPERTY_PARTITION = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}propertyPartition`);
  public static readonly VOID_CLASS_PARTITION = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}classPartition`);
  public static readonly VOID_VOCABULARY = DF.namedNode(`${DatasetSummaryCollectorVoID.VOID_PREFIX}vocabulary`);

  private static readonly DATASET_REGEX = new RegExp(/#?(\w+)$/u, 'u');

  public register(dataset: string, quad: RDF.Quad): void {
    const summary = this.getDatasetSummary(dataset);
    summary.totalQuads++;
    if (quad.subject.termType === 'NamedNode' || quad.subject.termType === 'BlankNode') {
      const subjectString = termToString(quad.subject);
      summary.distinctSubjects.add(subjectString);
      if (quad.predicate.termType === 'NamedNode') {
        let predicateSubjects = summary.distinctSubjectsByPredicate.get(quad.predicate.value);
        if (!predicateSubjects) {
          predicateSubjects = new Set();
          summary.distinctSubjectsByPredicate.set(quad.predicate.value, predicateSubjects);
        }
        predicateSubjects.add(subjectString);
        if (
          quad.predicate.value === DatasetSummaryCollectorVoID.RDF_TYPE.value &&
          quad.object.termType === 'NamedNode'
        ) {
          let entitiesByClass = summary.entitiesByClass.get(quad.object.value);
          if (!entitiesByClass) {
            entitiesByClass = new Set();
            summary.entitiesByClass.set(quad.object.value, entitiesByClass);
          }
          entitiesByClass.add(subjectString);
          summary.vocabularies.add(this.vocabularyFromIri(quad.object.value));
        }
      }
    }
    if (
      quad.object.termType === 'NamedNode' ||
      quad.object.termType === 'BlankNode' ||
      quad.object.termType === 'Literal'
    ) {
      const objectString = termToString(quad.object);
      summary.distinctObjects.add(objectString);
      if (quad.predicate.termType === 'NamedNode') {
        let predicateObjects = summary.distinctObjectsByPredicate.get(quad.predicate.value);
        if (!predicateObjects) {
          predicateObjects = new Set();
          summary.distinctObjectsByPredicate.set(quad.predicate.value, predicateObjects);
        }
        predicateObjects.add(objectString);
      }
    }
    if (quad.predicate.termType === 'NamedNode') {
      summary.totalQuadsByPredicate.set(
        quad.predicate.value,
        (summary.totalQuadsByPredicate.get(quad.predicate.value) ?? 0) + 1,
      );
      summary.vocabularies.add(this.vocabularyFromIri(quad.predicate.value));
    }
  }

  public async flush(sink: IQuadSink): Promise<void> {
    for (const [ dataset, summary ] of this.summaries) {
      const datasetIri = DF.namedNode(dataset);
      [
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.RDF_TYPE, DatasetSummaryCollectorVoID.VOID_DATASET),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_URISPACE, DF.literal(dataset.toString())),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_CLASSES, DF.literal(
          summary.entitiesByClass.size.toString(10),
          DatasetSummaryCollectorVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_TRIPLES, DF.literal(
          summary.totalQuads.toString(10),
          DatasetSummaryCollectorVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_PROPERTIES, DF.literal(
          summary.totalQuadsByPredicate.size.toString(10),
          DatasetSummaryCollectorVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
          summary.distinctSubjects.size.toString(10),
          DatasetSummaryCollectorVoID.XSD_INTEGER,
        )),
        DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_DISTINCT_OBJECTS, DF.literal(
          summary.distinctObjects.size.toString(10),
          DatasetSummaryCollectorVoID.XSD_INTEGER,
        )),
      ].forEach(async quad => await sink.push(dataset, quad));
      for (const vocabulary of summary.vocabularies) {
        await sink.push(
          dataset,
          DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_VOCABULARY, DF.namedNode(vocabulary)),
        );
      }
      for (const [ predicate, count ] of summary.totalQuadsByPredicate) {
        const partitionIri = DF.namedNode(`${dataset}#${this.hashString(predicate)}`);
        [
          DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_PROPERTY_PARTITION, partitionIri),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.RDF_TYPE, DatasetSummaryCollectorVoID.VOID_DATASET),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_PROPERTY, DF.namedNode(predicate)),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_TRIPLES, DF.literal(
            count.toString(10),
            DatasetSummaryCollectorVoID.XSD_INTEGER,
          )),
        ].forEach(async quad => await sink.push(dataset, quad));
        const distinctSubjectsForPredicate = summary.distinctSubjectsByPredicate.get(predicate);
        if (distinctSubjectsForPredicate) {
          await sink.push(
            dataset,
            DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_DISTINCT_SUBJECTS, DF.literal(
              distinctSubjectsForPredicate.size.toString(10),
              DatasetSummaryCollectorVoID.XSD_INTEGER,
            )),
          );
        }
        const distinctObjectsForPredicate = summary.distinctObjectsByPredicate.get(predicate);
        if (distinctObjectsForPredicate) {
          await sink.push(
            dataset,
            DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_DISTINCT_OBJECTS, DF.literal(
              distinctObjectsForPredicate.size.toString(10),
              DatasetSummaryCollectorVoID.XSD_INTEGER,
            )),
          );
        }
      }
      for (const [ rdfclass, entities ] of summary.entitiesByClass) {
        const partitionIri = DF.namedNode(`${dataset}#${this.hashString(rdfclass)}`);
        [
          DF.quad(datasetIri, DatasetSummaryCollectorVoID.VOID_CLASS_PARTITION, partitionIri),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.RDF_TYPE, DatasetSummaryCollectorVoID.VOID_DATASET),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_CLASS, DF.namedNode(rdfclass)),
          DF.quad(partitionIri, DatasetSummaryCollectorVoID.VOID_ENTITIES, DF.literal(
            entities.size.toString(),
            DatasetSummaryCollectorVoID.XSD_INTEGER,
          )),
        ].forEach(async quad => await sink.push(dataset, quad));
      }
    }
  }

  protected createDatasetSummary(): IDatasetSummaryVoID {
    return {
      totalQuads: 0,
      distinctSubjects: new Set(),
      distinctObjects: new Set(),
      vocabularies: new Set(),
      totalQuadsByPredicate: new Map(),
      distinctSubjectsByPredicate: new Map(),
      distinctObjectsByPredicate: new Map(),
      entitiesByClass: new Map(),
    };
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
    return iri.replace(DatasetSummaryCollectorVoID.DATASET_REGEX, '');
  }
}
