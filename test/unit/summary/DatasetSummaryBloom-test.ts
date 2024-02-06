import { Bloem } from 'bloem';
import { DataFactory } from 'rdf-data-factory';
import type { IDatasetSummary } from '../../../lib/summary/DatasetSummary';
import { DatasetSummaryBloom } from '../../../lib/summary/DatasetSummaryBloom';
import 'jest-rdf';

const DF = new DataFactory();

describe('DatasetSummaryBloom', () => {
  const dataset = DF.namedNode('http://example.org/');
  const hashBits = 256;
  const hashCount = 4;

  const quads = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.literal('o')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  let summary: IDatasetSummary;

  beforeEach(() => {
    summary = new DatasetSummaryBloom({ dataset: dataset.value, hashBits, hashCount });
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => summary.register(quad));
    const filters = summary.toQuads().filter(quad =>
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
        expect(filters.some(filter => filter.has(namedNodeBuffer))).toBeTruthy();
      }
    }
  });

  it('should produce a description without any quads registered', async() => {
    expect(summary.toQuads()).toBeRdfIsomorphic([]);
  });

  it('should always produce rdf:type in the first quad for each subject', async() => {
    quads.forEach(quad => summary.register(quad));
    const typedSubjects = new Set<string>();
    for (const quad of summary.toQuads()) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryBloom.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
