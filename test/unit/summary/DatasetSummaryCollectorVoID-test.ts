import { createHash } from 'crypto';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { termToString } from 'rdf-string';
import type { IDatasetSummaryCollector } from '../../../lib/summary/DatasetSummaryCollector';
import { DatasetSummaryCollectorVoID } from '../../../lib/summary/DatasetSummaryCollectorVoID';
import 'jest-rdf';

const DF = new DataFactory();

const hashTerm = (term: RDF.Term): string => createHash('md5').update(termToString(term)).digest('hex');

describe('DatasetSummaryVoID', () => {
  const dataset = DF.namedNode('http://example.org/');
  const quadClass = DF.namedNode('ex:c');
  const quadPredicate = DF.namedNode('ex:p');

  const quads = [
    DF.quad(DF.namedNode('ex:s'), DatasetSummaryCollectorVoID.RDF_TYPE, quadClass),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), quadPredicate, DF.literal('example')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  const propertyPartitionRdfType = DF.namedNode(`${dataset.value}#${hashTerm(DatasetSummaryCollectorVoID.RDF_TYPE)}`);
  const propertyPartitionPredicate = DF.namedNode(`${dataset.value}#${hashTerm(quadPredicate)}`);
  const classPartition = DF.namedNode(`${dataset.value}#${hashTerm(quadClass)}`);

  let sink: any;
  let output: Map<string, RDF.Quad[]>;
  let collector: IDatasetSummaryCollector;

  beforeEach(() => {
    output = new Map();
    sink = {
      push: jest.fn((ds, quad) => {
        let dsQuads = output.get(ds);
        if (!dsQuads) {
          dsQuads = [];
          output.set(ds, dsQuads);
        }
        dsQuads.push(quad);
      }),
    };
    collector = new DatasetSummaryCollectorVoID({});
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    await collector.flush(sink);
    expect(output.get(dataset.value)).toBeRdfIsomorphic([
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.RDF_TYPE,
        DatasetSummaryCollectorVoID.VOID_DATASET,
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_URISPACE,
        DF.literal(dataset.value),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_CLASSES,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_TRIPLES,
        DF.literal('5', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_PROPERTIES,
        DF.literal('2', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('3', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_VOCABULARY,
        DF.namedNode(`${quadClass.value.split(':')[0]}:`),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_VOCABULARY,
        DF.namedNode(DatasetSummaryCollectorVoID.RDF_TYPE.value.split('#')[0]),
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_PROPERTY_PARTITION,
        propertyPartitionPredicate,
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_PROPERTY_PARTITION,
        propertyPartitionRdfType,
      ),
      DF.quad(
        dataset,
        DatasetSummaryCollectorVoID.VOID_CLASS_PARTITION,
        classPartition,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryCollectorVoID.RDF_TYPE,
        DatasetSummaryCollectorVoID.VOID_DATASET,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryCollectorVoID.VOID_PROPERTY,
        quadPredicate,
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryCollectorVoID.VOID_TRIPLES,
        DF.literal('3', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionPredicate,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('2', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryCollectorVoID.RDF_TYPE,
        DatasetSummaryCollectorVoID.VOID_DATASET,
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryCollectorVoID.VOID_PROPERTY,
        DatasetSummaryCollectorVoID.RDF_TYPE,
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryCollectorVoID.VOID_TRIPLES,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_SUBJECTS,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        propertyPartitionRdfType,
        DatasetSummaryCollectorVoID.VOID_DISTINCT_OBJECTS,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
      DF.quad(
        classPartition,
        DatasetSummaryCollectorVoID.RDF_TYPE,
        DatasetSummaryCollectorVoID.VOID_DATASET,
      ),
      DF.quad(
        classPartition,
        DatasetSummaryCollectorVoID.VOID_CLASS,
        quadClass,
      ),
      DF.quad(
        classPartition,
        DatasetSummaryCollectorVoID.VOID_ENTITIES,
        DF.literal('1', DatasetSummaryCollectorVoID.XSD_INTEGER),
      ),
    ]);
  });

  it('should not produce a description without any quads registered', async() => {
    await collector.flush(sink);
    expect(sink.push).not.toHaveBeenCalled();
  });

  it('should always produce rdf:type as the first quad', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    await collector.flush(sink);
    const typedSubjects = new Set<string>();
    for (const quad of output.get(dataset.value)!) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryCollectorVoID.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
