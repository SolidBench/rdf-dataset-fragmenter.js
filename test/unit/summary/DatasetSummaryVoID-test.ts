import { createHash } from 'crypto';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { termToString } from 'rdf-string';
import type { IDatasetSummary } from '../../../lib/summary/DatasetSummary';
import { DatasetSummaryVoID } from '../../../lib/summary/DatasetSummaryVoID';
import 'jest-rdf';

const DF = new DataFactory();

const hashTerm = (term: RDF.Term): string => createHash('md5').update(termToString(term)).digest('hex');

describe('DatasetSummaryVoID', () => {
  const dataset = DF.namedNode('http://example.org/');
  const quadClass = DF.namedNode('ex:c');
  const quadPredicate = DF.namedNode('ex:p');

  const quads = [
    DF.quad(DF.namedNode('ex:s'), DatasetSummaryVoID.RDF_TYPE, quadClass),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.literal('example')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  const propertyPartitionRdfType = DF.namedNode(`${dataset.value}#${hashTerm(DatasetSummaryVoID.RDF_TYPE)}`);
  const propertyPartitionPredicate = DF.namedNode(`${dataset.value}#${hashTerm(quadPredicate)}`);
  const classPartition = DF.namedNode(`${dataset.value}#${hashTerm(quadClass)}`);

  let collector: IDatasetSummary;

  beforeEach(() => {
    collector = new DatasetSummaryVoID({ dataset: dataset.value });
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => collector.register(quad));
    expect(collector.serialize().quads).toBeRdfIsomorphic([
      DF.quad(
        dataset,
        DatasetSummaryVoID.RDF_TYPE,
        DatasetSummaryVoID.VOID_DATASET,
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_URISPACE,
        DF.literal(dataset.value),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_CLASSES,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_TRIPLES,
        DF.literal('5', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_PROPERTIES,
        DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('3', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_VOCABULARY,
        DF.namedNode(`${quadClass.value.split(':')[0]}:`),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_VOCABULARY,
        DF.namedNode(DatasetSummaryVoID.RDF_TYPE.value.split('#')[0]),
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_PROPERTY_PARTITION,
        propertyPartitionPredicate,
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_PROPERTY_PARTITION,
        propertyPartitionRdfType,
      ),
      DF.quad(
        dataset,
        DatasetSummaryVoID.VOID_CLASS_PARTITION,
        classPartition,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryVoID.RDF_TYPE,
        DatasetSummaryVoID.VOID_DATASET,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryVoID.VOID_PROPERTY,
        quadPredicate,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryVoID.VOID_TRIPLES,
        DF.literal('3', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryVoID.RDF_TYPE,
        DatasetSummaryVoID.VOID_DATASET,
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryVoID.VOID_PROPERTY,
        DatasetSummaryVoID.RDF_TYPE,
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryVoID.VOID_TRIPLES,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
      DF.quad(
        classPartition,
        DatasetSummaryVoID.RDF_TYPE,
        DatasetSummaryVoID.VOID_DATASET,
      ),
      DF.quad(
        classPartition,
        DatasetSummaryVoID.VOID_CLASS,
        quadClass,
      ),
      DF.quad(
        classPartition,
        DatasetSummaryVoID.VOID_ENTITIES,
        DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
      ),
    ]);
  });

  it('should not produce a description without any quads registered', async() => {
    expect(collector.serialize().quads).toBeRdfIsomorphic([]);
  });

  it('should always produce rdf:type as the first quad', async() => {
    quads.forEach(quad => collector.register(quad));
    const typedSubjects = new Set<string>();
    for (const quad of collector.serialize().quads) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryVoID.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
