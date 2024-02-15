import { Readable } from 'stream';
import arrayifyStream from 'arrayify-stream';
import { DataFactory } from 'rdf-data-factory';
import { FragmentationStrategyComposite } from '../../../lib/strategy/FragmentationStrategyComposite';

const streamifyArray = require('streamify-array');

const DF = new DataFactory();

jest.mock('../../../lib/io/ParallelFileWriter');

describe('FragmentationStrategyComposite', () => {
  let sink: any;
  let strategySub1: any;
  let strategySub2: any;
  let strategySub3: any;
  let strategy: FragmentationStrategyComposite;
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
    strategy = new FragmentationStrategyComposite([
      strategySub1,
      strategySub2,
      strategySub3,
    ]);
  });

  describe('fragment', () => {
    it('should handle an empty stream', async() => {
      await strategy.fragment(streamifyArray([]), sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data1).toEqual([]);
      expect(strategySub2.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data2).toEqual([]);
      expect(strategySub3.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data3).toEqual([]);
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
      expect(strategySub2.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data2).toEqual([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
      ]);
      expect(strategySub3.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(await data3).toEqual([
        DF.quad(DF.namedNode('ex:s1'), DF.namedNode('ex:p1'), DF.namedNode('ex:o1')),
        DF.quad(DF.namedNode('ex:s2'), DF.namedNode('ex:p2'), DF.namedNode('ex:o2')),
      ]);
    });

    it('should handle an erroring stream', async() => {
      const stream: any = new Readable();
      stream._read = () => {
        stream.emit('error', new Error('Error in stream'));
      };
      await strategy.fragment(stream, sink);
      expect(sink.push).not.toHaveBeenCalled();
      expect(strategySub1.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(strategySub2.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(strategySub3.fragment).toHaveBeenCalledWith(expect.anything(), sink);
      expect(error1).toEqual(new Error('Error in stream'));
      expect(error2).toEqual(new Error('Error in stream'));
      expect(error3).toEqual(new Error('Error in stream'));
      await expect(data1).rejects.toThrow(new Error('Error in stream'));
      await expect(data2).rejects.toThrow(new Error('Error in stream'));
      await expect(data3).rejects.toThrow(new Error('Error in stream'));
    });
  });
});
