import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyResourceObject } from '../../../lib/strategy/FragmentationStrategyResourceObject';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategyResourceObject', () => {
  let strategy: FragmentationStrategyResourceObject;
  let sink: any;
  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    strategy = new FragmentationStrategyResourceObject('hasMaliciousCreator$');
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
    });

    it('should handle a triple with target predicate', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(1);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o', quads[0]);
    });

    it('should throw on a triple with target predicate having a literal value', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.literal('ex:o')),
      ];
      await expect(strategy.fragment(streamifyArray([ ...quads ]), sink)).rejects
        .toThrowError(`Expected target predicate value of type NamedNode on resource 'ex:s1', but got 'ex:o' (Literal)`);
    });

    it('should handle triples of a resource after target predicate', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o', quads[2]);
    });

    it('should handle triples of a resource before target predicate', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o', quads[2]);
    });

    it('should handle multiple resources after target predicate', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o2')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o3')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(9);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o1', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o1', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o1', quads[2]);
      expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:o2', quads[3]);
      expect(sink.push).toHaveBeenNthCalledWith(5, 'ex:o2', quads[4]);
      expect(sink.push).toHaveBeenNthCalledWith(6, 'ex:o2', quads[5]);
      expect(sink.push).toHaveBeenNthCalledWith(7, 'ex:o3', quads[6]);
      expect(sink.push).toHaveBeenNthCalledWith(8, 'ex:o3', quads[7]);
      expect(sink.push).toHaveBeenNthCalledWith(9, 'ex:o3', quads[8]);
    });

    it('should handle multiple resources before and after target predicate', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o2')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o3')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(9);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o1', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o1', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o1', quads[2]);
      expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:o2', quads[3]);
      expect(sink.push).toHaveBeenNthCalledWith(5, 'ex:o2', quads[4]);
      expect(sink.push).toHaveBeenNthCalledWith(6, 'ex:o2', quads[5]);
      expect(sink.push).toHaveBeenNthCalledWith(7, 'ex:o3', quads[6]);
      expect(sink.push).toHaveBeenNthCalledWith(8, 'ex:o3', quads[7]);
      expect(sink.push).toHaveBeenNthCalledWith(9, 'ex:o3', quads[8]);
    });

    it('should handle multiple mixed resources', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o3')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o2')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(9);
      expect(sink.push).toHaveBeenCalledWith('ex:o1', quads[0]);
      expect(sink.push).toHaveBeenCalledWith('ex:o3', quads[1]);
      expect(sink.push).toHaveBeenCalledWith('ex:o3', quads[2]);
      expect(sink.push).toHaveBeenCalledWith('ex:o2', quads[3]);
      expect(sink.push).toHaveBeenCalledWith('ex:o2', quads[4]);
      expect(sink.push).toHaveBeenCalledWith('ex:o1', quads[5]);
      expect(sink.push).toHaveBeenCalledWith('ex:o1', quads[6]);
      expect(sink.push).toHaveBeenCalledWith('ex:o2', quads[7]);
      expect(sink.push).toHaveBeenCalledWith('ex:o3', quads[8]);
    });

    it('should warn on resources without target predicate', async() => {
      (<any> console).warn = jest.fn();
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),

        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p1'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(3);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o', quads[2]);

      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple occurrences of the target predicate on the same resource', async() => {
      const quads = [
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p2'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p3'), DF.namedNode('ex:o')),
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:hasMaliciousCreator'), DF.namedNode('ex:ox')),
      ];
      await strategy.fragment(streamifyArray([ ...quads ]), sink);
      expect(sink.push).toHaveBeenCalledTimes(4);
      expect(sink.push).toHaveBeenNthCalledWith(1, 'ex:o', quads[0]);
      expect(sink.push).toHaveBeenNthCalledWith(2, 'ex:o', quads[1]);
      expect(sink.push).toHaveBeenNthCalledWith(3, 'ex:o', quads[2]);
      expect(sink.push).toHaveBeenNthCalledWith(4, 'ex:o', quads[3]);
    });
  });
});
