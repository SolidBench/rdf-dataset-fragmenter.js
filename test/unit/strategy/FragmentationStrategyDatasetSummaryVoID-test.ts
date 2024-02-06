import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyDatasetSummaryVoID } from '../../../lib/strategy/FragmentationStrategyDatasetSummaryVoID';
import { DatasetSummaryVoID } from '../../../lib/summary/DatasetSummaryVoID';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategySubject', () => {
  let strategy: FragmentationStrategyDatasetSummaryVoID;
  let quadsEmpty: RDF.Quad[];
  let quadsNoBnodes: RDF.Quad[];
  let quadsVariables: RDF.Quad[];
  let quadsOwnedBnode: RDF.Quad[];
  let quadsOwnedBnodeReverse: RDF.Quad[];
  let quadsOwnedBnodeChained: RDF.Quad[];
  let quadsOwnedBnodeChainedReverse: RDF.Quad[];
  let quadsOwnedBnodes: RDF.Quad[];
  let quadsOwnedBnodeMultipleSameDoc: RDF.Quad[];
  let quadsOwnedBnodeMultipleDiffDoc: RDF.Quad[];
  let quadsUnownedBnode: RDF.Quad[];
  let sink: any;
  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    quadsEmpty = [];
    quadsNoBnodes = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsVariables = [
      DF.quad(DF.variable('ex:s1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnode = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeReverse = [
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    ];
    quadsOwnedBnodeChained = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
      DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeChainedReverse = [
      DF.quad(DF.blankNode('b3'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.blankNode('b3')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
    ];
    quadsOwnedBnodes = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b2')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsOwnedBnodeMultipleSameDoc = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o2')),
    ];
    quadsOwnedBnodeMultipleDiffDoc = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b1'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
    quadsUnownedBnode = [
      DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p'), DF.blankNode('b1')),
      DF.quad(DF.blankNode('b2'), DF.namedNode('ex:p'), DF.namedNode('ex:o')),
    ];
  });

  describe('without eager flushing', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategyDatasetSummaryVoID({
        iriToDataset: { '^(ex:[a-z0-9]+)$': '$1' },
      });
    });

    describe('fragment', () => {
      it('should handle an empty stream', async() => {
        await strategy.fragment(streamifyArray([ ...quadsEmpty ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
      });

      it('should handle a stream without blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsNoBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(26);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsNoBnodes[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsNoBnodes[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsNoBnodes[2].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsNoBnodes[2].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with variables', async() => {
        await strategy.fragment(streamifyArray([ ...quadsVariables ]), sink);
        expect(sink.push).not.toHaveBeenCalled();
      });

      it('should handle a stream with owned blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnode ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnode[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnode[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with owned blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeReverse[1].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeReverse[1].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with owned chained blank node', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChained ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeChained[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeChained[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('4', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with owned chained blank node in reverse link order', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeChainedReverse ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeChainedReverse[3].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeChainedReverse[3].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('4', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with multiple owned blank nodes', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodes ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(26);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodes[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodes[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsOwnedBnodes[2].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsOwnedBnodes[2].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with owned blank nodes in the same document', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleSameDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeMultipleSameDoc[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeMultipleSameDoc[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('3', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream with owned blank node in multiple documents', async() => {
        await strategy.fragment(streamifyArray([ ...quadsOwnedBnodeMultipleDiffDoc ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(26);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[1].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s2', DF.quad(
          quadsOwnedBnodeMultipleDiffDoc[1].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('2', DatasetSummaryVoID.XSD_INTEGER),
        ));
      });

      it('should handle a stream unowned blank node, and ignore it', async() => {
        await strategy.fragment(streamifyArray([ ...quadsUnownedBnode ]), sink);
        expect(sink.push).toHaveBeenCalledTimes(13);
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsUnownedBnode[0].subject,
          DatasetSummaryVoID.RDF_TYPE,
          DatasetSummaryVoID.VOID_DATASET,
        ));
        expect(sink.push).toHaveBeenCalledWith('ex:s1', DF.quad(
          quadsUnownedBnode[0].subject,
          DatasetSummaryVoID.VOID_TRIPLES,
          DF.literal('1', DatasetSummaryVoID.XSD_INTEGER),
        ));
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
});
