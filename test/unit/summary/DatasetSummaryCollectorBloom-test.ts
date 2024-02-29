import type * as RDF from '@rdfjs/types';
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
  const datasetToSummary = { '(.*)': '$1' };

  const quads = [
    DF.quad(DF.namedNode('ex:s'), DatasetSummaryCollectorBloom.RDF_TYPE, DF.namedNode('ex:t')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s'), DF.namedNode('ex:p'), DF.literal('example')),
    DF.quad(DF.variable('s'), DF.variable('p'), DF.variable('o')),
  ];

  let sink: any;
  let output: Map<string, RDF.Quad[]>;
  let collector: IDatasetSummaryCollector;

  beforeEach(() => {
    output = new Map();
    collector = new DatasetSummaryCollectorBloom({ hashBits, hashCount, datasetToSummary });
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
  });

  it('should properly register quads', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    await collector.flush(sink);
    const filters = output.get(dataset.value)?.filter(quad =>
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

  it('should not produce a description without any quads registered', async() => {
    await collector.flush(sink);
    expect(sink.push).not.toHaveBeenCalled();
  });

  it('should always produce rdf:type in the first quad for each subject', async() => {
    quads.forEach(quad => collector.register(dataset.value, quad));
    await collector.flush(sink);
    const typedSubjects = new Set<string>();
    for (const quad of output.get(dataset.value)!) {
      if (!typedSubjects.has(quad.subject.value)) {
        expect(quad.predicate.value).toEqual(DatasetSummaryCollectorBloom.RDF_TYPE.value);
        typedSubjects.add(quad.subject.value);
      }
    }
  });
});
