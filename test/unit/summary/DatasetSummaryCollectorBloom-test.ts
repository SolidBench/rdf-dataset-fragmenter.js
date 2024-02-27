import { Bloem } from 'bloem';
import { DataFactory } from 'rdf-data-factory';
import type { IDatasetSummaryCollector } from '../../../lib/summary/DatasetSummaryCollector';
import { DatasetSummaryCollectorBloom } from '../../../lib/summary/DatasetSummaryCollectorBloom';
import 'jest-rdf';

const DF = new DataFactory();

describe('DatasetSummaryCollectorBloom', () => {
  const dataset = DF.namedNode('http://example.org/');
  const hashBits = 256;
  const hashCount = 4;

  const quads = [
    DF.quad(DF.namedNode('ex:s'), DatasetSummaryCollectorBloom.RDF_TYPE, DF.namedNode('ex:t')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.literal('example')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  let collector: IDatasetSummaryCollector;

  beforeEach(() => {
    collector = new DatasetSummaryCollectorBloom({ hashBits, hashCount });
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    const filters = collector.toQuads().get(dataset.value)?.filter(quad =>
      quad.predicate.value === DatasetSummaryCollectorBloom.MEM_PROP_BINARYREPRESENTATION.value &&
      quad.object.termType === 'Literal' &&
      quad.object.datatype === DatasetSummaryCollectorBloom.XSD_BASE64)
      .map(quad => new Bloem(hashBits, hashCount, Buffer.from(quad.object.value, 'base64')));
    for (const quad of quads) {
      const namedNodeBuffers = [
        quad.subject,
        quad.predicate,
        quad.object,
      ].filter(trm => trm.termType === 'NamedNode').map(trm => Buffer.from(trm.value));
      for (const namedNodeBuffer of namedNodeBuffers) {
        expect(filters?.some(filter => filter.has(namedNodeBuffer))).toBeTruthy();
      }
    }
  });

  it('should produce a description without any quads registered', async() => {
    expect(collector.toQuads()).toBeRdfIsomorphic([]);
  });

  it('should always produce rdf:type in the first quad for each subject', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    const typedSubjects = new Set<string>();
    for (const quad of collector.toQuads().get(dataset.value)!) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryCollectorBloom.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
