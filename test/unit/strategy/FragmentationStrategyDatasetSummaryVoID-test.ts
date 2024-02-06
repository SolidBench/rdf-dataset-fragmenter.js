import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyDatasetSummaryVoID } from '../../../lib/strategy/FragmentationStrategyDatasetSummaryVoID';
import type { IFragmentationStrategy } from '../../../lib/strategy/IFragmentationStrategy';
import { DatasetSummaryVoID } from '../../../lib/summary/DatasetSummaryVoID';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

describe('FragmentationStrategyDatasetSummaryVoID', () => {
  const quadsEmpty: RDF.Quad[] = [];
  const quadsNoBnodes = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsVariables = [
    DF.quad(DF.variable('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnode = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeReverse = [
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
  ];
  const quadsOwnedBnodeChained = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
    DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeChainedReverse = [
    DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
  ];
  const quadsOwnedBnodes = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b2')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsOwnedBnodeMultipleSameDoc = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o2')),
  ];
  const quadsOwnedBnodeMultipleDiffDoc = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];
  const quadsUnownedBnode = [
    DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
  ];

  let sink: any;
  let strategy: IFragmentationStrategy;

  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    strategy = new FragmentationStrategyDatasetSummaryVoID({
      datasetPatterns: [ '^(ex:[a-z0-9]+)$' ],
    });
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a stream without blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(28);
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[0].subject.value,
        DF.quad(quadsNoBnodes[0].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsNoBnodes[2].subject.value,
        DF.quad(quadsNoBnodes[2].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
    });

    it('should handle a stream with variables', async() => {
      await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a stream with owned blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnode[0].subject.value,
        DF.quad(quadsOwnedBnode[0].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnode[0].subject.value,
        DF.quad(
          quadsOwnedBnode[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with owned blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        DF.quad(quadsOwnedBnodeReverse[1].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeReverse[1].subject.value,
        DF.quad(
          quadsOwnedBnodeReverse[1].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with owned chained blank node', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        DF.quad(quadsOwnedBnodeChained[0].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChained[0].subject.value,
        DF.quad(
          quadsOwnedBnodeChained[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('4', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with owned chained blank node in reverse link order', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        DF.quad(quadsOwnedBnodeChainedReverse[3].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeChainedReverse[3].subject.value,
        DF.quad(
          quadsOwnedBnodeChainedReverse[3].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('4', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with multiple owned blank nodes', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(28);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[0].subject.value,
        DF.quad(quadsOwnedBnodes[0].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[0].subject.value,
        DF.quad(
          quadsOwnedBnodes[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(quadsOwnedBnodes[2].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodes[2].subject.value,
        DF.quad(
          quadsOwnedBnodes[2].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with owned blank nodes in the same document', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleSameDoc[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleSameDoc[0].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleSameDoc[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('3', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream with owned blank node in multiple documents', async() => {
      await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(28);
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[0].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[1].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsOwnedBnodeMultipleDiffDoc[1].subject.value,
        DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[1].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should handle a stream unowned blank node, and ignore it', async() => {
      await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(14);
      expect(sink.push).toHaveBeenCalledWith(
        quadsUnownedBnode[0].subject.value,
        DF.quad(quadsUnownedBnode[0].subject, DatasetSummaryVoID.RDF_TYPE, DatasetSummaryVoID.VOID_DATASET),
      );
      expect(sink.push).toHaveBeenCalledWith(
        quadsUnownedBnode[0].subject.value,
        DF.quad(
          quadsUnownedBnode[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
        ),
      );
    });

    it('should reject on an erroring stream', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      await expect(strategy.fragment(stream, sink)).rejects.toThrow(new Error('Error in stream'));
    });
  });
});
