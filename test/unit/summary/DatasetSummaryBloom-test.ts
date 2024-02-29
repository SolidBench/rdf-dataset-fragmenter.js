import { Bloem } from 'bloem';
import { DataFactory } from 'rdf-data-factory';
import type { IDatasetSummary } from '../../../lib/summary/DatasetSummary';
import { DatasetSummaryBloom } from '../../../lib/summary/DatasetSummaryBloom';
import 'jest-rdf';

const DF = new DataFactory();

describe('DatasetSummaryCollectorBloom', () => {
  const dataset = DF.namedNode('http://example.org/');
  const hashBits = 256;
  const hashCount = 4;

  const quads = [
    DF.quad(DF.namedNode('ex:s'), DatasetSummaryBloom.RDF_TYPE, DF.namedNode('ex:t')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.literal('example')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  let collector: IDatasetSummary;

  beforeEach(() => {
    collector = new DatasetSummaryBloom({ hashBits, hashCount, iri: dataset.value, dataset: dataset.value });
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => collector.register(quad));
    const filters = collector.serialize().quads.filter(quad =>
      quad.predicate.value === DatasetSummaryBloom.MEM_PROP_BINARYREPRESENTATION.value &&
      quad.object.termType === 'Literal' &&
      quad.object.datatype === DatasetSummaryBloom.XSD_BASE64)
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

  it('should not produce a description without any quads registered', async() => {
    expect(collector.serialize().quads).toBeRdfIsomorphic([]);
  });

  it('should always produce rdf:type in the first quad for each subject', async() => {
    quads.forEach(quad => collector.register(quad));
    const typedSubjects = new Set<string>();
    for (const quad of collector.serialize().quads) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryBloom.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
