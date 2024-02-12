import { Readable } from 'stream';
import type * as RDF from '@rdfjs/types';
import arrayifyStream from 'arrayify-stream';
import { DataFactory } from 'rdf-data-factory';
import {
  FragmentationStrategyException,
  FragmentationStrategyExceptionEntry,
} from '../../../lib/strategy/FragmentationStrategyException';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategyException', () => {
  let sink: any;
  let strategySub1: any;
  let strategySub2: any;
  let strategySub3: any;
  let strategy: FragmentationStrategyException;
  let error1: Error;
  let error2: Error;
  let error3: Error;
  let data1: any;
  let data2: any;
  let data3: any;
  beforeEach(() => {
    sink = {
      push: jest.fn(),
    };
    strategySub1 = {
      fragment: jest.fn((stream: any) => {
        return new Promise<void>(resolve => {
          stream.on('error', (error: any) => {
            error1 = error;
            resolve();
          });
          stream.on('end', resolve);
          data1 = arrayifyStream(stream);
        });
      }),
    };
    strategySub2 = {
      fragment: jest.fn((stream: any) => {
        return new Promise<void>(resolve => {
          stream.on('error', (error: any) => {
            error2 = error;
            resolve();
          });
          stream.on('end', resolve);
          data2 = arrayifyStream(stream);
        });
      }),
    };
    strategySub3 = {
      fragment: jest.fn((stream: any) => {
        return new Promise<void>(resolve => {
          stream.on('error', (error: any) => {
            error3 = error;
            resolve();
          });
          stream.on('end', resolve);
          data3 = arrayifyStream(stream);
        });
      }),
    };
  });

  describe('without exceptions', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategyException(strategySub1, []);
    });

    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data1).toEqual([]);
    });

    it('should handle a non-empty stream', async() => {
      await strategy.fragment(streamifyArray([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
      ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data1).toEqual([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
      ]);
    });

    it('should handle an erroring stream', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      await expect(strategy.fragment(stream, sink)).rejects.toEqual(new Error('Error in stream'));
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
    });

    it('should throw if handleQuad is called directly', async() => {
      await expect((<any> strategy).handleQuad()).rejects
        .toThrowError('Illegal state: handleQuad can only be called via fragment');
    });
  });

  describe('with exceptions', () => {
    beforeEach(() => {
      strategy = new FragmentationStrategyException(strategySub1, [
        new FragmentationStrategyExceptionEntry({
          matches: (quad: RDF.Quad) => quad.subject.value === 'ex:s2',
        }, strategySub2),
        new FragmentationStrategyExceptionEntry({
          matches: (quad: RDF.Quad) => quad.subject.value === 'ex:s3',
        }, strategySub3),
      ]);
    });

    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data1).toEqual([]);
    });

    it('should handle a non-empty stream', async() => {
      await strategy.fragment(streamifyArray([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
      ]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data1).toEqual([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
      ]);
      expect(strategySub2.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data2).toEqual([
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
      ]);
      expect(strategySub3.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data3).toEqual([
        DF.quad(DF.namedNode('ex:s3'), DF.namedNode('ex:p3'), DF.namedNode('ex:o3')),
      ]);
    });

    it('should handle an erroring stream', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      await expect(strategy.fragment(stream, sink)).rejects.toEqual(new Error('Error in stream'));
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
    });
  });
});
